#!/usr/bin/env bash
set -e
root=$(pwd)

# App dependencies
cd ${root}/app
yarn upgrade:expo

# Lambdas
# see https://stackoverflow.com/a/4747961/723506
for dir in $(find . -maxdepth 1 -mindepth 1 -type d)
do
    if [ -f "${dir}/package.json" ]
    then
      echo "Upgrading ${dir}..."
      cd $dir
      rm -rf yarn.lock node_modules
      yarn
      cd ${root}
    fi
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
