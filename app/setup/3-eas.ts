import { readFileSync, writeFileSync } from 'fs';


// Add scripts to package.json (but don't overwritie them if they already exist)

const packageJson = JSON.parse(readFileSync('../package.json').toString());
const scripts = packageJson.scripts || {};

// Preview
scripts.preview = scripts.preview || "eas build --platform all";
scripts["preview:android"] = scripts["preview:android"] || "eas build --profile preview --platform android";
scripts["preview:ios"] = scripts["preview:ios"] || "eas build --profile preview --platform ios";

// Production
scripts.production = scripts.build || "eas build --platform all";
scripts["production:android"] = scripts["build:android"] || "eas build --platform android";
scripts["production:ios"] = scripts["build:ios"] || "eas build --platform ios";

writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));


// Set iOS and Android identifiers if the app is configured for that platform (but don't overwritie if they already exist)

const appId = process.env.APP_ID;

const appJson = JSON.parse(readFileSync('../app.json').toString());
if (appJson.expo.ios) appJson.expo.ios.bundleIdentifier = appJson.expo.ios.bundleIdentifier || appId || 'com.myapp';
if (appJson.expo.android) appJson.expo.android.package = appJson.expo.android.package || appId || 'com.myapp';

writeFileSync('../app.json', JSON.stringify(appJson, null, 2));
