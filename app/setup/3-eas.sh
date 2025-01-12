#!/usr/bin/env bash
set -e

echo "Setting up Expo Application Services (EAS) builds"

# https://docs.expo.dev/build/setup/
npm install -g eas-cli
cd ..
eas login
eas build:configure

# Add build scripts to package.json
cd setup
ts-node 3-eas.ts
