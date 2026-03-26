#!/bin/bash
# Simple local server to avoid CORS issues with ES modules and WASM
echo "Starting local LabWired dev server at http://localhost:8000"
echo "Open http://localhost:8000/playground/ to test the playground."
python3 -m http.server 8000
