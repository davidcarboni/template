# Template

This is a template repo to get you started building services from a common baseline.

## Overview

This repo implements:

 * Frontend (Cloudfront - modify the contents of `/web/public` to update the frontend)
 * Lambda (API - modify `/api/src/routes.ts` to build an API)
 * AWS CLoud Development Kit (CDK) infrastructure as code
 * Scloud constructs
 * Scloud Github Actions integration

## Getting started

Prerequisites
 * Either a domain name with an existing zone in Route53, or the ability to update name servers for a domain to point to a new zone file you'll create in Route53. A working domain is required to provision SSL certificates.
 * A Github personal access token with "repo" permissions

Setup
 * Clone this repo, rename the directory and change the remote to the repo you're setting up
 * run `./setup.sh` to generate and set up a template CDK infrastructure (the CDK stack will be named to match the name of the current directory)
 * edit the generated `*.sh` files under `.infrastructure/secrets/` to set the domain name (and optionally zone ID if using a pre-existing zone) Github details (including personal access token)
 * If your AWS account already has an OpenID Connect provider (e.g. if other stacks are deployed to this account) you will need to comment out the `githubActions(this).ghaOidcProvider();` line in `.infrastructure/lib/*-stack.ts`. You can check if there's already a provider by going to IAM -> (left menu) Access Management -> Identity providers. If there's an entry for `token.actions.githubusercontent.com` then you'll need to comment out the line in the stack code. The provider enables keyless login from Github Actions to AWS for deployment.
 * From the `.infrastructure` directory run `./deploy.sh` to deploy the infrastructure
 * Once you're up and running, `/setup.sh` and the `/setup` direcory can be deleted

Development
 * Make the changes you need
 * Check in and push to Github
 * Check the build runs successfully via the "Actions" tab on Github
 * Your changes should now be deployed to AWS and visible via your domain over https
