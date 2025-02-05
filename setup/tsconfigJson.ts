import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('tsconfig.json').toString('utf8'));

// Updates for ESM
config.extends = '@tsconfig/node22/tsconfig.json';

fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2));
