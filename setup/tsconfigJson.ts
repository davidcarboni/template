import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('tsconfig.json').toString('utf8'));

// Updates for ESM
config.extends = '@tsconfig/node18/tsconfig.json';
delete config.compilerOptions.module;
delete config.compilerOptions.moduleResolution;

fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2));
