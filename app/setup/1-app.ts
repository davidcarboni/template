import { readFileSync, writeFileSync } from 'fs';

const packageJsonContent = readFileSync('../package.json').toString();
const packageJson = JSON.parse(packageJsonContent);
const scripts = packageJson.scripts || {};


// Add script (but don't overwritie them if it already exists)

// Upgrade & expo-doctor
scripts["upgrade:expo"] = scripts["upgrade:expo"] || "yarn add expo@latest && yarn upgrade && npx expo install --fix && npx expo-doctor";

writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));


// Set iOS and Android identifiers if the app is configured for that platform (but don't overwritie if they already exist)

const appId = process.env.APP_ID;

const appJson = JSON.parse(readFileSync('../app.json').toString());
appJson.expo.slug = appJson.expo.slug.toLowerCase();
appJson.expo.scheme = appJson.expo.slug.toLowerCase();
if (appJson.expo.ios) appJson.expo.ios.bundleIdentifier = appJson.expo.ios.bundleIdentifier || appId || 'com.myapp';
if (appJson.expo.android) appJson.expo.android.package = appJson.expo.android.package || appId || 'com.myapp';
if (appJson.expo.web) delete appJson.expo.web;

writeFileSync('../app.json', JSON.stringify(appJson, null, 2));


const tsconfigJson = readFileSync('../tsconfig.json').toString();
const tsconfig = JSON.parse(tsconfigJson);
const compilerOptions = tsconfig.compilerOptions || {};

// Clears a spurious error on an empty conponent (<></>)
compilerOptions.jsx = 'react-jsx';

writeFileSync('../tsconfig.json', JSON.stringify(packageJson, null, 2));
