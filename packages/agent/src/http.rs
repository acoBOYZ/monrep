//! Outbound HTTPS to the pinned control plane (enroll / refresh).

use crate::store::DeviceCred;
use reqwest::Client;
use serde::Deserialize;
use std::time::Duration;

pub fn client() -> anyhow::Result<Client> {
  Ok(
    Client::builder()
      .use_rustls_tls()
      .timeout(Duration::from_secs(30))
      .build()?,
  )
}

#[derive(Debug, Deserialize)]
struct EnrollResponse {
  #[serde(rename = "deviceId")]
  device_id: String,
  #[serde(rename = "deviceSecret")]
  device_secret: String,
  #[serde(rename = "controlUrl")]
  control_url: String,
}

#[derive(Debug, Deserialize)]
struct TokenResponse {
  #[serde(rename = "accessToken")]
  access_token: String,
  #[serde(rename = "expiresAt")]
  #[expect(
    dead_code,
    reason = "deserialized for API shape; unused until refresh scheduling"
  )]
  expires_at: i64,
}

#[derive(Debug, Deserialize)]
struct ApiErrorBody {
  message: Option<String>,
  error: Option<String>,
}

/// POST `/api/agent/enroll` against the control plane.
pub async fn enroll_with_control_plane(
  control_url: &str,
  token: &str,
) -> anyhow::Result<DeviceCred> {
  let client = client()?;
  let base = control_url.trim().trim_end_matches('/');
  let url = format!("{base}/api/agent/enroll");
  let res = client
    .post(&url)
    .json(&serde_json::json!({ "token": token }))
    .send()
    .await?;

  let status = res.status();
  let bytes = res.bytes().await?;
  if !status.is_success() {
    let msg = serde_json::from_slice::<ApiErrorBody>(&bytes)
      .ok()
      .and_then(|b| b.message.or(b.error))
      .unwrap_or_else(|| format!("enroll failed ({status})"));
    anyhow::bail!("{msg}");
  }

  let body: EnrollResponse = serde_json::from_slice(&bytes)?;
  Ok(DeviceCred {
    control_url: body.control_url.trim_end_matches('/').to_string(),
    device_id: body.device_id,
    token: body.device_secret,
  })
}

/// POST `/api/agent/token` — returns a short-lived access token for WSS.
pub async fn refresh_access(cred: &DeviceCred) -> anyhow::Result<String> {
  let client = client()?;
  let url = format!("{}/api/agent/token", cred.control_url.trim_end_matches('/'));
  let res = client
    .post(url)
    .json(&serde_json::json!({
      "deviceId": cred.device_id,
      "deviceSecret": cred.token,
    }))
    .send()
    .await?;

  let status = res.status();
  let bytes = res.bytes().await?;
  if !status.is_success() {
    let msg = serde_json::from_slice::<ApiErrorBody>(&bytes)
      .ok()
      .and_then(|b| b.message.or(b.error))
      .unwrap_or_else(|| format!("token refresh failed ({status})"));
    anyhow::bail!("{msg}");
  }

  let body: TokenResponse = serde_json::from_slice(&bytes)?;
  Ok(body.access_token)
}
