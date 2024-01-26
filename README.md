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
 * From the `.infrastructure` directory run `./setup.sh` to deploy the infrastructure

Development
 * Make the changes you need
 * Check in and push to Github
 * Check the build runs successfully via the "Actions" tab on Github
 * Your changes should now be deployed to AWS and visible via your domain over https
