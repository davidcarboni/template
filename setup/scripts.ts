import * as fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json').toString('utf8'));

// Update to ESM
pkg.type = 'module';

// Add additional scripts
pkg.scripts.lint = "eslint --fix bin lib";
pkg.scripts.secrets = "tsx github.ts";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
