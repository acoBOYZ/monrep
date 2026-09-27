#!/usr/bin/env bash
# Install monrep agent binary from GitHub Releases.
# Usage: curl -fsSL https://monrep.acoboyz.workers.dev/install.sh | sh
set -euo pipefail

REPO="${MONREP_REPO:-acoBOYZ/monrep}"
VERSION="${MONREP_VERSION:-latest}"
INSTALL_DIR_DEFAULT="/usr/local/bin"
BIN_NAME="monrep"

arch="$(uname -m)"
case "$arch" in
  x86_64|amd64) asset="monrep-linux-x86_64" ;;
  aarch64|arm64) asset="monrep-linux-aarch64" ;;
  *)
    echo "unsupported architecture: $arch (need x86_64 or aarch64)" >&2
    exit 1
    ;;
esac

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "monrep install currently supports Linux only" >&2
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
  echo "publish a GitHub Release with monrep-linux-* assets first" >&2
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

echo "✔ installed $($dest --version 2>/dev/null || echo monrep)"
echo
echo "Next:"
echo "  monrep enroll --url https://<your-control-plane> --token <one-time>"
echo "  monrep daemon"
