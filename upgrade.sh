#!/usr/bin/env bash
set -e
root=$(pwd)

# App dependencies
cd ${root}/app
yarn upgrade:expo

# Lambdas
for lambda in api slack
do
    cd ${root}/${lambda}
    rm -rf node_modules
    rm yarn.lock
    yarn
done

# Global dependencies
npm i -g \
  npm \
  yarn \
  typescript \
  ts-node \
  aws-cdk \
  react-native \
  react-devtools \
  create-react-native-app \
  eas-cli \
  --

# Check the app code
cd ${root}/app
yarn lint
yarn tsc
