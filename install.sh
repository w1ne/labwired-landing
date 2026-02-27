#!/usr/bin/env sh
# LabWired CLI Installer — https://labwired.com/install.sh
# Canonical source: https://github.com/w1ne/labwired-core/blob/main/scripts/install.sh
#
# Usage:
#   curl -fsSL https://labwired.com/install.sh | sh
#
# MIT License - Copyright (C) 2026 LabWired

RAW_URL="https://raw.githubusercontent.com/w1ne/labwired-core/main/scripts/install.sh"

# Download and execute the canonical install script from the public repository.
if command -v curl >/dev/null 2>&1; then
  exec curl -fsSL --retry 3 "$RAW_URL" | sh -s -- "$@"
elif command -v wget >/dev/null 2>&1; then
  exec wget -qO- "$RAW_URL" | sh -s -- "$@"
else
  echo "Error: neither curl nor wget is available. Please install one and try again." >&2
  exit 1
fi
