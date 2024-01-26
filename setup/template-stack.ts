import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Cognito, BuildsBucket, QueueFunction, WebRoutes, ZipFunction, githubActions,
} from '@scloud/cdk-patterns';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Function } from 'aws-cdk-lib/aws-lambda';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

function envVar(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}

export default class TemplateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // This only needs to be created once per account. If you already have one, you can delete this.
    githubActions(this).ghaOidcProvider();

    // You'll need a zone to create DNS records in. This will need to be referenced by a real domain name so that SSL certificate creation can be authorised.
    // NB the DOMAIN_NAME environment variable is defined in .infrastructure/secrets/domain.sh
    const zone = this.zone(envVar('DOMAIN_NAME'), process.env.ZONE_ID);

    // A bucket to hold zip files for Lambda functions
    // This is useful because updating a Lambda function in the infrastructure might set the Lambda code to a default placeholder.
    // Having a bucket to store the code in means we can update the Lambda function to use the code, either here in the infrastructure build, or from the Github Actions build.
    const builds = new BuildsBucket(this)

    // An optional queue for sending notifications to Slack
    const slackQueue = this.slack();

    // Cognito authentication
    const cognito = this.cognito();

    // Example bucket
    const aBucket = new Bucket(this, 'bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TEMP so you can clean up the stack without resources being left behind
    });

    // Example DynamoDB table
    const aTable = new Table(this, 'table', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // TEMP so you can clean up the stack without resources being left behind
    });

    // Example Github Actions variables
    // NB the scloud constructs will create most of the variables you need automatically
    githubActions(this).addGhaVariable('variableMcVariableFace', 'custom', 'a build variavle value'); // 'variableMcVariableFace' will be translated to 'VARIABLE_MC_VARIABLE_FACE_CUSTOM' in Github Actions

    // Example Github Actions secret
    // NB the scloud constructs will create most of the secrets you need automatically
    githubActions(this).addGhaSecret('secretMcSecretFace', 'test'); // 'secretMcSecretFace' will be translated to 'SECRET_MC_SECRET_FACE' in Github Actions

    // Create the frontend and API using Cloudfront
    // The following calls will create variables in Github Actions that can be used to deploy the frontend and API:
    // * API_LAMBDA - the name of the Lambda function to update when deploying the API
    // * CLOUDFRONT_BUCKET - for uploading the frontend
    // * CLOUDFRONT_DISTRIBUTIONID - for invalidating the Cloudfront cache
    const api = this.api(cognito, builds, aBucket, aTable, slackQueue);
    WebRoutes.routes(this, 'cloudfront', { '/api/*': api }, {
      zone,
      domainName: envVar('DOMAIN_NAME'),
      defaultIndex: true,
      redirectWww: true,
      functionAssociation: {
        // Enables mappling paths like /privacy to /privacy.html so they can be served from s3
        function: new cloudfront.Function(this, 'cfFunction', {
          code: cloudfront.FunctionCode.fromFile({ filePath: './lib/cfFunction.js' }),
          comment: 'Rewrite URLs to .html and redirect /register, /iphone and /android',
        }),
        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
      },
    });

    // Set up OIDC access from Github Actions - this enables builds to deploy updates to the infrastructure
    const owner = envVar('OWNER', process.env.USERNAME); // Either OWNER, or USERNAME environment variables can be used
    const repo = envVar('REPO');
    githubActions(this).ghaOidcRole({ owner, repo });
  }

  /**
   * NB: creating a hosted zone is not free. You will be charged $0.50 per month for each hosted zone.
   * @param zoneName The name of the hosted zone - this is assumed to be the same as the domain name and will be used by other constructs (e.g. for SSL certificates),
   * @param zoneId Optional. The ID of an existing hosted zone. If you already have a hosted zone, you can pass the zoneId to this function to get a reference to it, rather than creating a new one.
   */
  zone(zoneName: string, zoneId?: string): IHostedZone {
    if (zoneId) {
      return HostedZone.fromHostedZoneAttributes(this, 'zone', {
        hostedZoneId: zoneId,
        zoneName,
      });
    }

    // Fall back to creating a new HostedZone - costs $0.50 per month
    return new HostedZone(this, 'zone', {
      zoneName,
    });
  }

  slack(): Queue {
    const slack = QueueFunction.node(this, 'slack', {
      environment: {
        SLACK_WEBHOOK: envVar('SLACK_WEBHOOK'),
      },
    });
    return slack.queue;
  }

  cognito(): Cognito {
    // Cognito for authentication
    const stack = cdk.Stack.of(this);
    const authDomainPrefix = `${stack.stackName}-${envVar('COGNITO_DOMAIN_PREFIX')}`.toLowerCase(); // COGNITO_DOMAIN_PREFIX needs to be unique, but also constant, otherwise we get an error on deployment. This is auto-generated and can be replaced with a value of your choice.
    const callbackUrl = `https://${envVar('DOMAIN_NAME')}/auth`;

    // Default to using a "domain prefix"
    return Cognito.withEmailLogin(this, 'cognito', callbackUrl, undefined, undefined, undefined, authDomainPrefix);

    // To create Cognito with Social logins, you can use:
    // Cognito.withSocialLogins(this, 'cognito', callbackUrl, ... );

    // To create a custom domain (e.g. auth.DOMAIN_NAME) you can use the following.
    // NB at the time of writing there are a maximum of 4 custom domains per account.
    // return Cognito.withEmailLogin(this, 'cognito', callbackUrl, undefined, zone);
  }

  api(
    cognito: Cognito,
    builds: Bucket,
    aBucket: Bucket,
    aTable: Table,
    slackQueue: Queue,
  ): Function {
    // Lambda for the Node API
    const api = ZipFunction.node(this, 'api', {
      environment: {
        SIGNIN_URL: cognito.signInUrl(),
        SLACK_QUEUE_URL: slackQueue.queueUrl,
        BUCKET: aBucket.bucketName,
        TABLE: aTable.tableName,
      },
      functionProps: {
        memorySize: 3008,
        // code: Code.fromBucket(builds, 'api.zip'), // This can be uncommented once you've run a build of the API code
      },
    });

    aBucket.grantReadWrite(api);
    aTable.grantReadWriteData(api);
    slackQueue.grantSendMessages(api);

    return api;
  }
}
