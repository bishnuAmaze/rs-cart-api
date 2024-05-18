import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as lambda from '@aws-cdk/aws-lambda';
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import * as iam from '@aws-cdk/aws-iam';

export class MyNestJSBackendStack extends cdk.Stack {
  // constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
  //   super(scope, id, props);

  //   // NestJS Lambda Function
  //   const nestApp = new lambda.Function(this, 'NestAppFunction', {
  //     runtime: lambda.Runtime.NODEJS_16_X,
  //     code: lambda.Code.fromAsset('../src'),
  //     handler: 'handleRequest',
  //   });

  //   // API Gateway
  //   const api = new apigateway.LambdaRestApi(this, 'Endpoint', {
  //     handler: nestApp,
  //   });
  // }

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secret = secretsmanager.Secret.fromSecretAttributes(
      this,
      'ImportedSecret',
      {
        secretCompleteArn:
          'arn:aws:secretsmanager:us-west-2:058264555641:secret:BkbDatabaseSecret-3DGwXE',
      },
    );

    const vpc = ec2.Vpc.fromLookup(this, 'vpc-09dad707af2ef8c5e', {
      isDefault: true,
    });

    // const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
    //   this,
    //   'bkb-rds-cloud-x-database-sq',
    //   'sg-069a0e887be0cb937',
    // );

    const securityGroup = new ec2.SecurityGroup(this, 'BkbDatabaseSecret', {
      vpc: vpc,
      description: 'Security group for Lambda function',
      allowAllOutbound: true,
    });

    securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.allTraffic());

    const dbInstance = rds.DatabaseInstance.fromDatabaseInstanceAttributes(
      this,
      'bkb-rds-cloud-x-database',
      {
        instanceEndpointAddress:
          'bkb-rds-cloud-x-database.c30iys4a0dp3.us-east-1.rds.amazonaws.com',
        instanceIdentifier: 'bkb-rds-cloud-x-database',
        port: 5432,
        securityGroups: [securityGroup],
        engine: rds.DatabaseInstanceEngine.POSTGRES,
      },
    );

    // NestJS Lambda Function
    const nestApp = new lambda.Function(this, 'main.ts', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('../src'),
      handler: 'handleRequest',
      environment: {
        DB_HOST: `${process.env.DB_HOST}`,
        DB_USER: `${process.env.DB_USER}`,
        DB_NAME: `${process.env.DB_NAME}`,
      },
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      allowAllOutbound: false,
      allowPublicSubnet: true,
      securityGroups: [securityGroup],
      initialPolicy: [
        new iam.PolicyStatement({
          actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
          resources: [secret.secretArn],
        }),
      ],
    });
  }
}
