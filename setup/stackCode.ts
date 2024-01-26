import * as fs from 'fs';

const verify = (content: string, search: string) => {
  if (!content.includes(search)) throw new Error(`Could not find ${search} in content`);
};

// Get the stack name from the command line parameter
if (process.argv.length < 3) throw new Error('Please provide a stack name');
const stackName = process.argv[process.argv.length - 1];

// Source files to update
const libPath = `lib/${stackName}-stack.ts`;

let stack = fs.readFileSync(libPath).toString('utf8');
let template = fs.readFileSync('../setup/template-stack.ts').toString('utf8');

// Update imports and add utility function
const classMarker = 'export default class';
verify(stack, classMarker);
verify(template, classMarker);
const head = template.slice(0, template.indexOf(classMarker));
stack = stack.slice(stack.indexOf(classMarker)); // tail
stack = head + stack;

// Update with template stack code
const codeMarker = '// The code that defines your stack goes here';
verify(stack, codeMarker);
verify(template, codeMarker);
stack = stack.slice(0, stack.indexOf(codeMarker)); // head
const code = template.slice(template.indexOf(codeMarker)); // tail
stack = stack + code;

fs.writeFileSync(libPath, stack);
