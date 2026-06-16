#!/usr/bin/env bash
# exit on error
set -o errexit

npm install --prefix app/frontend
npm run build --prefix app/frontend
npm install --prefix app/backend
