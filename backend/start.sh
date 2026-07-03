#!/usr/bin/env bash
# Start the FastAPI backend (run from repo root or backend/)
cd "$(dirname "$0")"
/home/sephy/customerai/venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
