import * as fs from 'fs';

const capital = (s: string) => s[0].toUpperCase() + s.slice(1);

const replace = (path: string, search: string, replace: string) => {
  let code = fs.readFileSync(path).toString();

  if (code.includes(search)) {
    code = code.replace(search, replace);
  } else throw new Error(`Could not find ${search} in ${path}`);

  fs.writeFileSync(path, code);
};

// Get the stack name from the command line parameter
if (process.argv.length < 3) throw new Error('Please provide a stack name');
const stackName = process.argv[process.argv.length - 1];

// Source files to update
const binPath = `bin/${stackName}.ts`;
const libPath = `lib/${stackName}-stack.ts`;

// Compute the stack name as it appears in the code
const className = `${capital(stackName)}Stack`;
console.log(`Updating ${className} in ${binPath} and ${libPath}`);

// Update to default import
replace(binPath, `import { ${className} }`, `import ${className}`);
replace(libPath, `export class ${className}`, `export default class ${className}`);

// Update the stack name to not have the word "Stack" on the end
// (it's redundant and clutters reading astack names in the CloudFormation listing of stacks)
replace(binPath, `new ${className}(app, '${className}', {`, `const stack = new ${className}(app, '${capital(stackName)}', {`);

// Tag all stack resources - can be useful for reporting, e.g on cost
replace(binPath, `import * as cdk from 'aws-cdk-lib';`, `import * as cdk from 'aws-cdk-lib';\nimport { Tags } from 'aws-cdk-lib';`);
replace(binPath, `});`, `});\nTags.of(stack).add('stack', stack.stackName);\n`);
