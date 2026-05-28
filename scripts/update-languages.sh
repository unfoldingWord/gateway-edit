#!/bin/bash
#!/usr/bin/env bash

set -euo pipefail

URL="https://git.door43.org/api/v1/languages/langnames.json"
OUTPUT_FILE="src/common/languages.json"
OUTPUT_DIR="$(dirname "$OUTPUT_FILE")"

mkdir -p "$OUTPUT_DIR"

if command -v curl >/dev/null 2>&1; then
  curl --fail --location --silent --show-error "$URL" --output "$OUTPUT_FILE"
elif command -v wget >/dev/null 2>&1; then
  wget --quiet --output-document="$OUTPUT_FILE" "$URL"
else
  echo "Error: curl or wget is required to download languages.json." >&2
  exit 1
fi

echo "Downloaded $URL"
echo "Saved to $OUTPUT_FILE"
