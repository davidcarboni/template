import * as fs from 'fs';

const pkg = JSON.parse(fs.readFileSync('package.json').toString('utf8'));

// Update all dependencies to * so we can always update to the latest versions/patches:
Object.keys(pkg.dependencies).forEach((key) => {
  pkg.dependencies[key] = '*';
});
Object.keys(pkg.devDependencies).forEach((key) => {
  pkg.devDependencies[key] = '*';
});

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
