#!/usr/bin/env bash
set -eu

  # Secrets, potentially including an AWS_PROFILE variable:
for i in secrets/*.sh; do
  echo " * $i"
  source $i
done

# AWS profile
if [ -z "$AWS_PROFILE" ]; then
  echo "Using default AWS profile"
else
  echo "Using AWS profile: $AWS_PROFILE"
fi

echo "Starting infrastructure build: $(date)"
# cdk bootstrap

# Lint
npm run lint

# Show differences
cdk diff

read -p "Do you want to proceed? (y/N) " yn
case $yn in
	y ) echo Deploying...;;
	* ) echo Exit;
		exit 0;;
esac

# Skip approval on the basis we've already done a diff above so this creates a repeat y/n prompt:
cdk deploy --require-approval never --outputs-file ./secrets/cdk-outputs.json

# Update secrets
echo "Setting Github secrets"
npm run secrets

echo "End: $(date)"
