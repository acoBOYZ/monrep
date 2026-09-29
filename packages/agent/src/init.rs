//! Linux systemd install: write unit, enable, start.

use crate::brand;
use crate::cli::{cmd_link, cmd_status, cmd_unlink, out};
use crate::store;
use std::io::{self, BufRead, IsTerminal, Write};
use std::path::Path;
use std::process::Command;

const UNIT_PATH: &str = "/etc/systemd/system/monrep.service";
const FALLBACK_BIN: &str = "/usr/local/bin/monrep";

pub async fn cmd_init(
  url: Option<String>,
  token: Option<String>,
  force: bool,
  no_start: bool,
) -> anyhow::Result<()> {
  ensure_linux()?;
  ensure_can_install_unit()?;

  let bin = resolve_bin()?;
  let (url, token) = resolve_link_args(url, token)?;

  prepare_link(&url, token.as_deref(), force).await?;

  let body = unit_body(&bin);
  fs_err::write(UNIT_PATH, body)?;
  out(&format!("init: wrote {UNIT_PATH}"))?;
  out(&format!("init: ExecStart={bin} run"))?;

  systemctl(&["daemon-reload"])?;
  systemctl(&["enable", "monrep.service"])?;
  if no_start {
    out("init: enabled (not started; --no-start)")?;
  } else {
    systemctl(&["start", "monrep.service"])?;
    out("init: enabled and started")?;
  }

  out("")?;
  cmd_status()?;
  out("")?;
  out("hint: systemctl status monrep --no-pager")?;
  Ok(())
}

fn ensure_linux() -> anyhow::Result<()> {
  if !cfg!(target_os = "linux") {
    anyhow::bail!("init is supported on Linux (systemd) only");
  }
  Ok(())
}

fn ensure_can_install_unit() -> anyhow::Result<()> {
  let dir = Path::new("/etc/systemd/system");
  if !dir.is_dir() {
    anyhow::bail!("systemd unit directory missing: {}", dir.display());
  }
  let probe = dir.join(".monrep-init-write-probe");
  match fs_err::OpenOptions::new()
    .write(true)
    .create(true)
    .truncate(true)
    .open(&probe)
  {
    Ok(_) => {
      let _ = fs_err::remove_file(&probe);
      Ok(())
    }
    Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
      anyhow::bail!("init requires root — run: sudo monrep init …");
    }
    Err(e) => Err(e.into()),
  }
}

fn resolve_bin() -> anyhow::Result<String> {
  if let Ok(exe) = std::env::current_exe() {
    let s = exe.display().to_string();
    if Path::new(&s).is_file() {
      return Ok(s);
    }
  }
  Ok(FALLBACK_BIN.to_string())
}

fn resolve_link_args(
  url: Option<String>,
  token: Option<String>,
) -> anyhow::Result<(String, Option<String>)> {
  let tty = io::stdin().is_terminal();
  let default_url = brand::CONTROL_PLANE_ORIGIN;
  let url = match url {
    Some(u) if !u.trim().is_empty() => u.trim().to_string(),
    Some(_) | None if tty => prompt_line(
      &format!("Control plane URL [{default_url}]: "),
      Some(default_url),
    )?,
    _ => anyhow::bail!("--url is required (non-interactive)"),
  };

  let already = store::load_optional()?;
  let token = match token {
    Some(t) if !t.trim().is_empty() => Some(t.trim().to_string()),
    Some(_) | None if already.is_some() => None,
    Some(_) | None if tty => {
      let t = prompt_line("Enroll token: ", None)?;
      if t.is_empty() {
        anyhow::bail!("enroll token is required");
      }
      Some(t)
    }
    _ => anyhow::bail!("--token is required when not yet linked (non-interactive)"),
  };

  Ok((url, token))
}

async fn prepare_link(url: &str, token: Option<&str>, force: bool) -> anyhow::Result<()> {
  match store::load_optional()? {
    Some(existing) if existing.control_url == url && !force => {
      out(&format!(
        "init: already linked to {} (device {})",
        existing.control_url, existing.device_id
      ))?;
      Ok(())
    }
    Some(existing) if !force => {
      anyhow::bail!(
        "already linked to {}; pass --force to unlink and re-link, or run monrep unlink",
        existing.control_url
      );
    }
    Some(_) => {
      cmd_unlink()?;
      let token = token.ok_or_else(|| anyhow::anyhow!("--token required with --force"))?;
      cmd_link(url, token).await
    }
    None => {
      let token = token.ok_or_else(|| anyhow::anyhow!("--token is required to link"))?;
      cmd_link(url, token).await
    }
  }
}

fn unit_body(bin: &str) -> String {
  format!(
    "\
# monrep outbound tunnel agent
[Unit]
Description=monrep fleet agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart={bin} run
Restart=always
RestartSec=2
# Prefer a dedicated user in production; root is fine when config lives under /root/.config
# User=monrep
# Group=monrep

[Install]
WantedBy=multi-user.target
"
  )
}

fn systemctl(args: &[&str]) -> anyhow::Result<()> {
  let status = Command::new("systemctl").args(args).status()?;
  if !status.success() {
    anyhow::bail!("systemctl {} failed ({status})", args.join(" "));
  }
  Ok(())
}

fn prompt_line(label: &str, default: Option<&str>) -> anyhow::Result<String> {
  io::stderr().write_all(label.as_bytes())?;
  io::stderr().flush()?;
  let mut line = String::new();
  io::stdin().lock().read_line(&mut line)?;
  let trimmed = line.trim();
  if trimmed.is_empty() {
    if let Some(d) = default {
      return Ok(d.to_string());
    }
    return Ok(String::new());
  }
  Ok(trimmed.to_string())
}
