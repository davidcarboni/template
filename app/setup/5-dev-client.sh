#!/usr/bin/env bash
set -e

echo "Installing expo dev client..."

# Add build script to package.json
ts-node 5-dev-client.ts

# Install dependency
cd ..
npx expo install expo-dev-client

echo "For documentation see: https://docs.expo.dev/develop/development-builds/introduction/"
