#!/usr/bin/env bash
# Install {{productName}} agent binary from GitHub Releases.
# Usage: curl -fsSL {{installUrl}} | sh
# Source: scripts/install-agent.sh.tpl — filled by bun run sync:brand
set -euo pipefail

REPO="${MONREP_REPO:-{{githubRepo}}}"
VERSION="${MONREP_VERSION:-latest}"
INSTALL_DIR_DEFAULT="/usr/local/bin"
BIN_NAME="{{binName}}"
ASSET_PREFIX="{{releaseAssetPrefix}}"

arch="$(uname -m)"
case "$arch" in
  x86_64|amd64) asset="${ASSET_PREFIX}-x86_64" ;;
  aarch64|arm64) asset="${ASSET_PREFIX}-aarch64" ;;
  *)
    echo "unsupported architecture: $arch (need x86_64 or aarch64)" >&2
    exit 1
    ;;
esac

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "{{productName}} install currently supports Linux only" >&2
  exit 1
fi

if [[ "$VERSION" == "latest" ]]; then
  api="https://api.github.com/repos/${REPO}/releases/latest"
else
  api="https://api.github.com/repos/${REPO}/releases/tags/${VERSION}"
fi

echo "→ resolving ${VERSION} release for ${asset} from ${REPO}"
url="$(curl -fsSL "$api" | grep -o "\"browser_download_url\":[[:space:]]*\"[^\"]*${asset}\"" | head -1 | sed 's/.*"\(https[^"]*\)".*/\1/')"
if [[ -z "$url" ]]; then
  echo "could not find asset ${asset} on ${REPO} ${VERSION}" >&2
  echo "publish a GitHub Release with ${ASSET_PREFIX}-* assets first" >&2
  exit 1
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
echo "→ downloading $url"
curl -fsSL "$url" -o "$tmp"
chmod +x "$tmp"

install_dir="${MONREP_INSTALL_DIR:-}"
if [[ -z "$install_dir" ]]; then
  if [[ -w "$INSTALL_DIR_DEFAULT" ]] || mkdir -p "$INSTALL_DIR_DEFAULT" 2>/dev/null; then
    install_dir="$INSTALL_DIR_DEFAULT"
  elif command -v sudo >/dev/null 2>&1; then
    install_dir="$INSTALL_DIR_DEFAULT"
    SUDO="sudo"
  else
    install_dir="${HOME}/.local/bin"
    mkdir -p "$install_dir"
  fi
fi
SUDO="${SUDO:-}"

dest="${install_dir}/${BIN_NAME}"
echo "→ installing to ${dest}"
$SUDO mkdir -p "$install_dir"
$SUDO mv "$tmp" "$dest"
$SUDO chmod +x "$dest"
trap - EXIT

echo "✔ installed $($dest --version 2>/dev/null || echo {{productName}})"
echo
echo "Next:"
echo "  {{binName}} enroll --url https://<your-control-plane> --token <one-time>"
echo "  {{binName}} daemon"
