
## Build inputs

 * Any input values you need for the build should be created in this directory.
 * Values need to be defined in `*.sh` files using `export MY_VAR=my_value`.
 * The `deploy.sh` script will source all `*.sh` files in this directory before calling `cdk deploy`.

## Build outputs

Values output from the CDK build will be written to this directory.
Additionally the scloud Github integration will write files to this directory that identify which CDK outputs should be used to set Github Actions variables and/or secrets:
 * `{stackName}.ghaVariables.json` - identifies CDK outputs that should be set as Github Actions variables
 * `{stackName}.ghaSecrets.json` - identifies CDK outputs that should be set as Github Actions secrets
