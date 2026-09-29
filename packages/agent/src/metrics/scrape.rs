//! Host scrapers — structured points (Linux /proc + portable libc fallbacks).

use super::db::MetricPoint;
use super::now_ms;
use std::fs;
use std::path::Path;
use std::sync::Mutex;

/// Previous CPU tick counters for delta-based `cpu.used_pct`.
static PREV_CPU_TICKS: Mutex<Option<(u64, u64)>> = Mutex::new(None);

pub fn scrape_host() -> Vec<MetricPoint> {
  let at = now_ms();
  let mut out = Vec::with_capacity(32);
  scrape_load(at, &mut out);
  scrape_cpu_used(at, &mut out);
  scrape_mem(at, &mut out);
  scrape_disk(at, &mut out);
  scrape_net(at, &mut out);
  scrape_host_meta(at, &mut out);
  scrape_docker(at, &mut out);
  out
}

fn push(out: &mut Vec<MetricPoint>, at: i64, name: &str, value: f64, dims: &str) {
  if !value.is_finite() {
    return;
  }
  out.push(MetricPoint {
    at,
    name: name.into(),
    value,
    dims: dims.into(),
  });
}

fn scrape_load(at: i64, out: &mut Vec<MetricPoint>) {
  // Portable: getloadavg on Linux + macOS/BSD.
  #[cfg(unix)]
  {
    let mut loads = [0f64; 3];
    let n = unsafe { libc::getloadavg(loads.as_mut_ptr(), 3) };
    if n == 3 {
      push(out, at, "cpu.load.1m", loads[0], "{}");
      push(out, at, "cpu.load.5m", loads[1], "{}");
      push(out, at, "cpu.load.15m", loads[2], "{}");
      return;
    }
  }
  let Ok(raw) = fs::read_to_string("/proc/loadavg") else {
    return;
  };
  let mut parts = raw.split_whitespace();
  let Some(l1) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
    return;
  };
  let Some(l5) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
    return;
  };
  let Some(l15) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
    return;
  };
  push(out, at, "cpu.load.1m", l1, "{}");
  push(out, at, "cpu.load.5m", l5, "{}");
  push(out, at, "cpu.load.15m", l15, "{}");
}

/// Busy/(busy+idle) over the scrape interval — comparable to Activity Monitor / CleanMyMac.
fn scrape_cpu_used(at: i64, out: &mut Vec<MetricPoint>) {
  let Some((idle, total)) = read_cpu_ticks() else {
    return;
  };
  let mut guard = match PREV_CPU_TICKS.lock() {
    Ok(g) => g,
    Err(_) => return,
  };
  if let Some((prev_idle, prev_total)) = *guard {
    let di = idle.saturating_sub(prev_idle);
    let dt = total.saturating_sub(prev_total);
    if dt > 0 {
      let busy = dt.saturating_sub(di) as f64;
      let used_pct = (busy / dt as f64) * 100.0;
      push(out, at, "cpu.used_pct", used_pct, "{}");
    }
  }
  *guard = Some((idle, total));
}

fn read_cpu_ticks() -> Option<(u64, u64)> {
  if let Some(t) = read_cpu_ticks_proc() {
    return Some(t);
  }
  #[cfg(target_os = "macos")]
  {
    read_cpu_ticks_macos()
  }
  #[cfg(not(target_os = "macos"))]
  {
    None
  }
}

fn read_cpu_ticks_proc() -> Option<(u64, u64)> {
  let raw = fs::read_to_string("/proc/stat").ok()?;
  let line = raw.lines().next()?;
  if !line.starts_with("cpu ") {
    return None;
  }
  let mut parts = line.split_whitespace().skip(1);
  let user: u64 = parts.next()?.parse().ok()?;
  let nice: u64 = parts.next()?.parse().ok()?;
  let system: u64 = parts.next()?.parse().ok()?;
  let idle: u64 = parts.next()?.parse().ok()?;
  let iowait: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let irq: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let softirq: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let steal: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
  let idle_all = idle.saturating_add(iowait);
  let total = user
    .saturating_add(nice)
    .saturating_add(system)
    .saturating_add(idle_all)
    .saturating_add(irq)
    .saturating_add(softirq)
    .saturating_add(steal);
  Some((idle_all, total))
}

#[cfg(target_os = "macos")]
fn read_cpu_ticks_macos() -> Option<(u64, u64)> {
  // HOST_CPU_LOAD_INFO = 3; CPU_STATE_{USER,SYSTEM,IDLE,NICE}
  const HOST_CPU_LOAD_INFO: libc::c_int = 3;
  const CPU_STATE_MAX: usize = 4;
  #[repr(C)]
  struct HostCpuLoadInfo {
    cpu_ticks: [u32; CPU_STATE_MAX],
  }
  let mut info = HostCpuLoadInfo {
    cpu_ticks: [0; CPU_STATE_MAX],
  };
  let mut count = (std::mem::size_of::<HostCpuLoadInfo>() / std::mem::size_of::<libc::integer_t>())
    as libc::mach_msg_type_number_t;
  let kr = unsafe {
    host_statistics(
      mach_host_self(),
      HOST_CPU_LOAD_INFO,
      &mut info as *mut _ as *mut libc::integer_t,
      &mut count,
    )
  };
  if kr != 0 {
    return None;
  }
  let user = info.cpu_ticks[0] as u64;
  let system = info.cpu_ticks[1] as u64;
  let idle = info.cpu_ticks[2] as u64;
  let nice = info.cpu_ticks[3] as u64;
  let total = user
    .saturating_add(system)
    .saturating_add(idle)
    .saturating_add(nice);
  Some((idle, total))
}

fn scrape_mem(at: i64, out: &mut Vec<MetricPoint>) {
  if !scrape_mem_proc(at, out) {
    #[cfg(target_os = "macos")]
    scrape_mem_macos(at, out);
  }
}

fn scrape_mem_proc(at: i64, out: &mut Vec<MetricPoint>) -> bool {
  let Ok(raw) = fs::read_to_string("/proc/meminfo") else {
    return false;
  };
  let mut total_kb = None;
  let mut avail_kb = None;
  let mut free_kb = None;
  let mut swap_total = None;
  let mut swap_free = None;
  for line in raw.lines() {
    let mut parts = line.split_whitespace();
    let Some(key) = parts.next() else { continue };
    let Some(val) = parts.next().and_then(|s| s.parse::<f64>().ok()) else {
      continue;
    };
    match key {
      "MemTotal:" => total_kb = Some(val),
      "MemAvailable:" => avail_kb = Some(val),
      "MemFree:" => free_kb = Some(val),
      "SwapTotal:" => swap_total = Some(val),
      "SwapFree:" => swap_free = Some(val),
      _ => {}
    }
  }
  let Some(total_kb) = total_kb else {
    return false;
  };
  let avail = avail_kb.or(free_kb).unwrap_or(0.0);
  let used = (total_kb - avail).max(0.0);
  push(out, at, "mem.total_bytes", total_kb * 1024.0, "{}");
  push(out, at, "mem.used_bytes", used * 1024.0, "{}");
  push(out, at, "mem.available_bytes", avail * 1024.0, "{}");
  if total_kb > 0.0 {
    push(out, at, "mem.used_pct", (used / total_kb) * 100.0, "{}");
  }
  if let (Some(st), Some(sf)) = (swap_total, swap_free) {
    let su = (st - sf).max(0.0);
    push(out, at, "swap.total_bytes", st * 1024.0, "{}");
    push(out, at, "swap.used_bytes", su * 1024.0, "{}");
    if st > 0.0 {
      push(out, at, "swap.used_pct", (su / st) * 100.0, "{}");
    }
  }
  true
}

#[cfg(target_os = "macos")]
fn scrape_mem_macos(at: i64, out: &mut Vec<MetricPoint>) {
  let Some(total) = sysctl_u64("hw.memsize") else {
    return;
  };
  if total == 0 {
    return;
  }
  let page_size = unsafe { libc::sysconf(libc::_SC_PAGESIZE) } as u64;
  if page_size == 0 {
    return;
  }
  let Some(vm) = host_vm_stats64() else {
    return;
  };
  // Darwin: free_count includes speculative. Available ≈ free + inactive + purgeable
  // (Activity Monitor / CleanMyMac style). free-only looks ~99% "used" and is wrong.
  let free = vm.free_count as u64;
  let inactive = vm.inactive_count as u64;
  let purgeable = vm.purgeable_count as u64;
  let avail_pages = free.saturating_add(inactive).saturating_add(purgeable);
  let avail = avail_pages.saturating_mul(page_size).min(total);
  let used = total.saturating_sub(avail);
  let used_pct = (used as f64 / total as f64) * 100.0;
  push(out, at, "mem.total_bytes", total as f64, "{}");
  push(out, at, "mem.used_bytes", used as f64, "{}");
  push(out, at, "mem.available_bytes", avail as f64, "{}");
  push(out, at, "mem.used_pct", used_pct, "{}");
}

#[cfg(target_os = "macos")]
fn sysctl_u64(name: &str) -> Option<u64> {
  let cname = std::ffi::CString::new(name).ok()?;
  let mut val: u64 = 0;
  let mut len = std::mem::size_of_val(&val);
  let rc = unsafe {
    libc::sysctlbyname(
      cname.as_ptr(),
      &mut val as *mut _ as *mut libc::c_void,
      &mut len,
      std::ptr::null_mut(),
      0,
    )
  };
  if rc == 0 { Some(val) } else { None }
}

/// Darwin `vm_statistics64` layout (must match SDK).
#[cfg(target_os = "macos")]
#[repr(C)]
#[derive(Clone, Copy, Default)]
struct HostVmStats64 {
  free_count: u32,
  active_count: u32,
  inactive_count: u32,
  wire_count: u32,
  zero_fill_count: u64,
  reactivations: u64,
  pageins: u64,
  pageouts: u64,
  faults: u64,
  cow_faults: u64,
  lookups: u64,
  hits: u64,
  purges: u64,
  purgeable_count: u32,
  speculative_count: u32,
  decompressions: u64,
  compressions: u64,
  swapins: u64,
  swapouts: u64,
  compressor_page_count: u32,
  throttled_count: u32,
  external_page_count: u32,
  internal_page_count: u32,
  total_uncompressed_pages_in_compressor: u64,
}

#[cfg(target_os = "macos")]
#[link(name = "System")]
unsafe extern "C" {
  fn mach_host_self() -> libc::mach_port_t;
  fn host_statistics(
    host_priv: libc::mach_port_t,
    flavor: libc::c_int,
    host_info_out: *mut libc::integer_t,
    host_info_outCnt: *mut libc::mach_msg_type_number_t,
  ) -> libc::kern_return_t;
  fn host_statistics64(
    host_priv: libc::mach_port_t,
    flavor: libc::c_int,
    host_info_out: *mut libc::integer_t,
    host_info_outCnt: *mut libc::mach_msg_type_number_t,
  ) -> libc::kern_return_t;
}

#[cfg(target_os = "macos")]
fn host_vm_stats64() -> Option<HostVmStats64> {
  const HOST_VM_INFO64: libc::c_int = 4;
  let mut stats = HostVmStats64::default();
  let mut count = (std::mem::size_of::<HostVmStats64>() / std::mem::size_of::<libc::integer_t>())
    as libc::mach_msg_type_number_t;
  let kr = unsafe {
    host_statistics64(
      mach_host_self(),
      HOST_VM_INFO64,
      &mut stats as *mut _ as *mut libc::integer_t,
      &mut count,
    )
  };
  if kr != 0 {
    return None;
  }
  Some(stats)
}

fn scrape_disk(at: i64, out: &mut Vec<MetricPoint>) {
  #[cfg(unix)]
  {
    scrape_disk_unix(at, out);
  }
  #[cfg(not(unix))]
  {
    let _ = (at, out);
  }
}

#[cfg(unix)]
fn scrape_disk_unix(at: i64, out: &mut Vec<MetricPoint>) {
  use std::ffi::CString;
  let mounts = ["/"];
  for mount in mounts {
    let Ok(cpath) = CString::new(mount) else {
      continue;
    };
    let mut s: libc::statvfs = unsafe { std::mem::zeroed() };
    let rc = unsafe { libc::statvfs(cpath.as_ptr(), &mut s) };
    if rc != 0 {
      continue;
    }
    let bsize = s.f_frsize as f64;
    let total = s.f_blocks as f64 * bsize;
    let avail = s.f_bavail as f64 * bsize;
    let used = (total - avail).max(0.0);
    let dims = format!(r#"{{"mount":"{mount}"}}"#);
    push(out, at, "disk.total_bytes", total, &dims);
    push(out, at, "disk.used_bytes", used, &dims);
    if total > 0.0 {
      push(out, at, "disk.used_pct", (used / total) * 100.0, &dims);
    }
  }
}

fn scrape_net(at: i64, out: &mut Vec<MetricPoint>) {
  let Ok(raw) = fs::read_to_string("/proc/net/dev") else {
    return;
  };
  for line in raw.lines().skip(2) {
    let line = line.trim();
    let Some((iface, rest)) = line.split_once(':') else {
      continue;
    };
    let iface = iface.trim();
    if iface == "lo" || iface.is_empty() {
      continue;
    }
    let cols: Vec<&str> = rest.split_whitespace().collect();
    if cols.len() < 9 {
      continue;
    }
    let Ok(rx) = cols[0].parse::<f64>() else {
      continue;
    };
    let Ok(tx) = cols[8].parse::<f64>() else {
      continue;
    };
    let dims = format!(r#"{{"iface":"{iface}"}}"#);
    push(out, at, "net.rx_bytes", rx, &dims);
    push(out, at, "net.tx_bytes", tx, &dims);
  }
}

fn scrape_host_meta(at: i64, out: &mut Vec<MetricPoint>) {
  if let Ok(raw) = fs::read_to_string("/proc/uptime")
    && let Some(up) = raw
      .split_whitespace()
      .next()
      .and_then(|s| s.parse::<f64>().ok())
  {
    push(out, at, "host.uptime_sec", up, "{}");
  } else {
    #[cfg(target_os = "macos")]
    {
      scrape_uptime_macos(at, out);
    }
  }

  if let Ok(raw) = fs::read_to_string("/proc/cpuinfo") {
    let n = raw.lines().filter(|l| l.starts_with("processor")).count() as f64;
    if n > 0.0 {
      push(out, at, "host.nproc", n, "{}");
      return;
    }
  }
  if let Ok(n) = std::thread::available_parallelism() {
    push(out, at, "host.nproc", n.get() as f64, "{}");
  }
}

#[cfg(target_os = "macos")]
fn scrape_uptime_macos(at: i64, out: &mut Vec<MetricPoint>) {
  #[repr(C)]
  struct Timeval {
    tv_sec: i64,
    tv_usec: i32,
  }
  let mut boot = Timeval {
    tv_sec: 0,
    tv_usec: 0,
  };
  let mut len = std::mem::size_of_val(&boot);
  let Ok(name) = std::ffi::CString::new("kern.boottime") else {
    return;
  };
  let rc = unsafe {
    libc::sysctlbyname(
      name.as_ptr(),
      &mut boot as *mut _ as *mut libc::c_void,
      &mut len,
      std::ptr::null_mut(),
      0,
    )
  };
  if rc != 0 || boot.tv_sec <= 0 {
    return;
  }
  let now = std::time::SystemTime::now()
    .duration_since(std::time::UNIX_EPOCH)
    .map(|d| d.as_secs() as i64)
    .unwrap_or(0);
  let up = (now - boot.tv_sec).max(0) as f64;
  push(out, at, "host.uptime_sec", up, "{}");
}

fn scrape_docker(at: i64, out: &mut Vec<MetricPoint>) {
  if !Path::new("/var/run/docker.sock").exists() {
    return;
  }
  let _ = (at, out);
}
