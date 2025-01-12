import { readFileSync, writeFileSync } from 'fs';

const json = readFileSync('../package.json').toString();
const packageJson = JSON.parse(json);
const scripts = packageJson.scripts || {};

// Add scripts (but don't overwritie them if they already exist)

// Development build
scripts.development = scripts.development || "eas build --profile development --platform all";

writeFileSync('../package.json', JSON.stringify(packageJson, null, 2));

// console.log(JSON.stringify(packageJson, null, 2));
