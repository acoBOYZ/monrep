//! Shared rustls roots for HTTPS + WSS (public CAs + optional Vite / MONREP_DEV_CA).

use anyhow::Context;
use fs_err as fs;
use reqwest::{Certificate, Client};
use rustls::ClientConfig;
use rustls::pki_types::CertificateDer;
use std::path::{Path, PathBuf};
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tokio::net::TcpStream;
use tokio_tungstenite::{
  Connector, MaybeTlsStream, WebSocketStream, connect_async, connect_async_tls_with_config,
  tungstenite::client::IntoClientRequest,
};

const DEV_CA_NAME: &str = "vite-dev-root.crt";

fn discover_dev_ca_path() -> Option<PathBuf> {
  if let Ok(p) = std::env::var("MONREP_DEV_CA") {
    let path = PathBuf::from(p);
    if path.is_file() {
      return Some(path);
    }
  }

  // Compile-time crate dir → monorepo `certs/vite-dev-root.crt` when developing in-tree.
  let from_manifest = Path::new(env!("CARGO_MANIFEST_DIR"))
    .join("../../certs")
    .join(DEV_CA_NAME);
  if let Ok(canon) = fs::canonicalize(&from_manifest)
    && canon.is_file()
  {
    return Some(canon);
  }

  // Walk up from cwd (e.g. when launched via bun from packages/agent).
  if let Ok(mut dir) = std::env::current_dir() {
    for _ in 0..8 {
      let candidate = dir.join("certs").join(DEV_CA_NAME);
      if candidate.is_file() {
        return fs::canonicalize(candidate).ok();
      }
      if !dir.pop() {
        break;
      }
    }
  }
  None
}

fn load_dev_ca_der() -> anyhow::Result<Option<Vec<CertificateDer<'static>>>> {
  let Some(path) = discover_dev_ca_path() else {
    return Ok(None);
  };
  let pem = fs::read(&path).with_context(|| format!("read dev CA {}", path.display()))?;
  let certs: Vec<CertificateDer<'static>> = rustls_pemfile::certs(&mut pem.as_slice())
    .collect::<Result<Vec<_>, _>>()
    .with_context(|| format!("parse PEM {}", path.display()))?;
  if certs.is_empty() {
    anyhow::bail!("no certificates in {}", path.display());
  }
  Ok(Some(certs))
}

fn root_store() -> anyhow::Result<rustls::RootCertStore> {
  let mut roots = rustls::RootCertStore::empty();
  roots.extend(webpki_roots::TLS_SERVER_ROOTS.iter().cloned());
  if let Some(extra) = load_dev_ca_der()? {
    for cert in extra {
      roots
        .add(cert)
        .map_err(|e| anyhow::anyhow!("add dev CA to root store: {e}"))?;
    }
  }
  Ok(roots)
}

fn rustls_client_config() -> anyhow::Result<Arc<ClientConfig>> {
  static CONFIG: OnceLock<Arc<ClientConfig>> = OnceLock::new();
  if let Some(c) = CONFIG.get() {
    return Ok(c.clone());
  }
  let roots = root_store()?;
  let config = ClientConfig::builder()
    .with_root_certificates(roots)
    .with_no_client_auth();
  let arc = Arc::new(config);
  let _ = CONFIG.set(arc.clone());
  Ok(arc)
}

/// HTTPS client with public CAs + optional local Vite root (`MONREP_DEV_CA` / auto-discover).
pub fn http_client() -> anyhow::Result<Client> {
  let mut builder = Client::builder()
    .use_rustls_tls()
    .timeout(Duration::from_secs(30));

  if let Some(path) = discover_dev_ca_path() {
    let pem = fs::read(&path).with_context(|| format!("read dev CA {}", path.display()))?;
    let cert = Certificate::from_pem(&pem)
      .with_context(|| format!("reqwest Certificate from {}", path.display()))?;
    builder = builder.add_root_certificate(cert);
  }

  Ok(builder.build()?)
}

/// Dial `ws://` or `wss://` using the same root store as [`http_client`].
pub async fn connect_ws(
  request: impl IntoClientRequest + Unpin,
) -> anyhow::Result<WebSocketStream<MaybeTlsStream<TcpStream>>> {
  let req = request.into_client_request()?;
  let is_tls = matches!(req.uri().scheme_str(), Some("wss") | Some("https"));
  if is_tls {
    let connector = Connector::Rustls(rustls_client_config()?);
    let (ws, _) = connect_async_tls_with_config(req, None, false, Some(connector)).await?;
    Ok(ws)
  } else {
    let (ws, _) = connect_async(req).await?;
    Ok(ws)
  }
}

/// Path currently used for the extra CA (for diagnostics).
pub fn active_dev_ca_path() -> Option<PathBuf> {
  discover_dev_ca_path()
}
