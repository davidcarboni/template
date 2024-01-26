## Template

 * Lambda
 * CDK
 * Scloud constructs
 * Scloud Github Actions integration

## Getting started

Prerequisites
 * Either a domain name with an existing zone in Route53
 * Or the ability to update name servers for a domain to point to a new zone file you'll create in Route53
 * A Github personal access token with "repo" permissions

Setup
 * run `./setup.sh` to generate and set up a template CDK infrastructure
 * edit `.infrastructure/secrets/domain.sh` and set the domain name thart matches the zone you'll reference or create

