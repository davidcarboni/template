import { updateGithub } from '@scloud/cdk-github';
// import { existsSync, readFileSync } from 'fs';

(async () => {
  // let githubDetails: Record<string, string> = {};
  // const githubDetailsFile = 'secrets/github.json';
  // if (existsSync(githubDetailsFile)) {
  //   const json = readFileSync(githubDetailsFile, 'utf-8');
  //   githubDetails = JSON.parse(json);
  // }
  await updateGithub(true); // , githubDetails);
})();
