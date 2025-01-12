#!/usr/bin/env bash
set -e

# https://stackoverflow.com/a/74133624/723506
printf "%s" "App name (e.g. MyApp): "
read APP_NAME
export APP_NAME
printf "%s" "Enter app package/bundle identifier (e.g. com.myapp): "
read APP_ID
export APP_ID

# npx create-expo-app@latest --help

# Info
#   Creates a new Expo project

# Usage
#   $ npx create-expo-app <path> [options]

# Options
#   -y, --yes             Use the default options for creating a project
#       --no-install      Skip installing npm packages or CocoaPods
#   -t, --template [pkg]  NPM template to use: blank, tabs, bare-minimum. Default: blank
#   -e, --example [name]  Example name from https://github.com/expo/examples.
#   -v, --version         Version number
#   -h, --help            Usage info

#   To choose a template pass in the --template arg:

#   $ npm create expo-app --template

#   To choose an Expo example pass in the --example arg:

#   $ npm create expo-app --example
#   $ npm create expo-app --example with-router

#   The package manager used for installing
#   node modules is based on how you invoke the CLI:

#     npm: npm create expo-app
#   yarn: yarn create expo-app
#   pnpm: pnpm create expo-app
#     bun: bun create expo-app

npx create-expo-app@latest "$APP_NAME"
# yarn create expo-app --example with-typescript

for i in $(find . -mindepth 1 -maxdepth 1 -type d -printf '%f\n'); do
  mv $i/* ../
  mv $i/.* ../
  rmdir $i
done

# Add an upgrade/doctor script to package.json and run it:
ts-node 1-app.ts
cd ..
yarn upgrade:expo

echo "App setup complete"
echo "you can now run 'cd ..' and 'yarn start' to run the app"
