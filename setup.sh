#!/usr/bin/env bash
set -eu

# https://stackoverflow.com/a/1371283/723506
name=${PWD##*/}
dir=$(pwd)
echo "> Setting up \"$name\" in $dir"

## Infrastructure

if [ ! -d "$name" ] && [ ! -d ".infrastructure" ]; then

  # Install cdk
  echo "> Install AWS Cloud Development Kit (CDK)"
  npm i -g aws-cdk

  # Generate CDK stack
  echo "> Generate $name CDK stack using interim directory name ./$name"
  mkdir $name
  cd $name
  cdk init app --language=typescript
  cd $dir
  echo "> Rename infrastructure directory from ./$name to ./.infrastructure"
  mv $name .infrastructure
  cd .infrastructure

  # Add scripts
  echo "> adding scripts"
  cp $dir/setup/deploy.sh .
  cp $dir/setup/diff.sh .
  cp $dir/setup/github.ts .
  ts-node $dir/setup/scripts.ts

  # Tweak code
  echo "> tweaking stack code"
  ts-node $dir/setup/codeUpdates.ts $name

  # Set up secrets directory
  echo secrets >> .gitignore
  mkdir secrets

  echo "\n## Build inputs\n" >> secrets/REATME.md
  echo "Add any input values you need for the build in this directory." >> secrets/README.md
  echo 'Values need to be defines in *.sh files using `export MY_VAR=my_value`.' >> secrets/README.md
  echo "Any *.sh files in this directory will be sourced before the infrastructure build runs." >> secrets/README.md

  echo "\n## Build outputs\n" >> secrets/README.md
  echo "Values output from the CDK build will be written to this directory." >> secrets/README.md
  echo "Additionally the scloud Github integration will write files to this directory that identify which CDK outputs should be used to set Github Actions variables and/or secrets." >> secrets/README.md

  echo "export AWS_PROFILE=default" >> secrets/aws.sh
  echo "export DOMAIN_NAME=example.com" >> secrets/domain.sh
  echo "# export ZONE_ID=Z0XXXXXXXXXXXXXXXXXXX" >> secrets/domain.sh
  echo "export COGNITO_DOMAIN_PREFIX=1706284937817" >> secrets/domain.sh
  echo "export SLACK_WEBHOOK=https://hooks.slack.com/services/xxxxxxxxxxx/xxxxxxxxxxx/xxxxxxxxxxxxxxxxxxx" >> secrets/slack.sh
  echo "export USERNAME=myusername" >> secrets/github.sh
  echo "export PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxx" >> secrets/github.sh
  echo "export OWNER=myorg" >> secrets/github.sh
  echo "export REPO=${name}" >> secrets/github.sh

  # Add template stack code
  echo "> Adding template stack code"
  cp $dir/setup/cfFunction.js ./lib/cfFunction.js
  ts-node $dir/setup/stackCode.ts $name

  # Install types, eslint and scloud libraries
  echo "> Installing additional dependencies"
  npm i --save-dev \
    @types/node \
    @types/aws-lambda \
    @typescript-eslint/eslint-plugin \
    @typescript-eslint/parser \
    @types/source-map-support \
    eslint \
    eslint-config-airbnb-base  \
    eslint-plugin-import \
    eslint-import-resolver-typescript \
    ts-node \
    --
  npm i \
    @scloud/cdk-github \
    @scloud/cdk-patterns \
    --
  cp $dir/setup/.eslintrc.js .

  # Update dependencies to "*" to keep everything up to date
  echo "> Setting dependencies to \"*\" to keep things up to date"
  ts-node $dir/setup/starDependencies.ts
  echo package-lock.json >> .gitignore

  # Bootstrap CDK
  echo "> Bootstrapping CDK (you need AWS credentials configured for this)"
  # Secrets, potentially including an AWS_PROFILE variable:
  for i in secrets/*.sh; do
    echo " * $i"
    source $i
  done
  # AWS profile check
  if [ -z "$AWS_PROFILE" ]; then
    echo " - Using default AWS profile"
  else
    echo " - Using AWS profile: $AWS_PROFILE"
  fi
  cdk bootstrap

  echo "> Success: infrastructure setup complete. Run \"./deploy.sh\" from the .infrastructure directory to deploy."
else
  echo " > Infrastructure already exists. Skipping cdk setup."
fi