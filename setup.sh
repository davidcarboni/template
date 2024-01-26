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

  # Add a README to explain how to use the secrets directory
  cp $dir/setup/README.md ./secrets/README.md

  # Add placeholder secrets
  echo "export DOMAIN_NAME=example.com" >> secrets/domain.sh
  echo "# export ZONE_ID=Z0XXXXXXXXXXXXXXXXXXX" >> secrets/domain.sh
  echo "export COGNITO_DOMAIN_PREFIX=$(date +%s)" >> secrets/domain.sh
  echo "export SLACK_WEBHOOK=https://hooks.slack.com/services/xxxxxxxxxxx/xxxxxxxxxxx/xxxxxxxxxxxxxxxxxxx" >> secrets/slack.sh
  echo "export USERNAME=myusername" >> secrets/github.sh
  echo "export PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxx" >> secrets/github.sh
  echo "export OWNER=myorg" >> secrets/github.sh
  echo "export REPO=${name}" >> secrets/github.sh
  if [ ! -z ${AWS_PROFILE+x} ] ; then # https://stackoverflow.com/a/13864829/723506
    echo "export AWS_PROFILE=${AWS_PROFILE}" >> secrets/aws.sh
  fi

  # Add template stack code
  echo "> Adding template stack code"
  cp $dir/setup/cfFunction.js ./lib/cfFunction.js
  ts-node $dir/setup/stackCode.ts $name
  printf "\n!cfFunction.js" >> .gitignore # CDK ignores *.js

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
  # Secrets are needed because the bootstrap will execute out stack code, which should fail if they're not set:
  for i in secrets/*.sh; do
    echo " * $i"
    source $i
  done
  cdk bootstrap

  echo "> Success: infrastructure setup complete. If this AWS account has no other stacks deployed, you can change to the ".infrastructure" directory and run \"./deploy.sh\". Otherwise, check for an existing OpenID Connect provider (see /README.md)"
else
  echo " > Infrastructure already exists. Skipping cdk setup."
fi