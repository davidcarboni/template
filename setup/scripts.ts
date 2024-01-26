import * as fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json').toString('utf8'));

// Add additional scripts
pkg.scripts.lint = "eslint --fix --ext ts bin lib";
pkg.scripts.secrets = "ts-node github.ts";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
