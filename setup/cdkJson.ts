import * as fs from 'fs';

const cdk = JSON.parse(fs.readFileSync('cdk.json').toString('utf8'));

// Update "npx ts-node --prefer-ts-exts bin/<stack>.ts"
// to "npx tsx bin/<stack>.ts"
const app = cdk.app;
const segments = app.split(' ');

// Take the firsat and last segments and put 'tsx' in the middle
cdk.app = `${segments.shift()} tsx ${segments.pop()}`;

fs.writeFileSync('cdk.json', JSON.stringify(cdk, null, 2));
