import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_kinesis as kinesis } from 'aws-cdk-lib';
import { StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { MsfScalaApp, MsfRuntimeEnvironment } from './msf-scala-app-construct';
import { AppStartLambdaConstruct } from './msf-start-lambda-construct';
import { KdsDataGenLambdaConstruct } from  './kds-datagen-lambda-construct'

export interface GlobalProps extends StackProps {
}

export class MsfStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: GlobalProps) {
    super(scope, id, props);

    // we'll be generating a CFN script so we need CFN params
    let cfnParams = this.getParams();

    // logs groups for the logging of the flink app
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: cfnParams.get("CloudWatchLogGroupName")!.valueAsString,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    const logStream = new logs.LogStream(this, 'LogStream', {
      logStreamName: cfnParams.get("CloudWatchLogStreamName")!.valueAsString,
      logGroup: logGroup,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const kinesisStream = new kinesis.Stream(this, 'SourceKinesisStream', {
      streamName: cfnParams.get("StreamName")!.valueAsString,
      streamMode: StreamMode.ON_DEMAND,
      retentionPeriod: cdk.Duration.hours(cfnParams.get("RetentionPeriodHours")!.valueAsNumber)
    });

    // iam policy to allow to write logs into the log groups
    const accessCWLogsPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [logGroup.logGroupArn],
          actions: ['logs:PutLogEvents',
                    'logs:DescribeLogGroups',
                    'logs:DescribeLogStreams'
                   ],
        }),
      ],
    });

    // iam policy to allow to write metrics into cloudwatch
    const accessCWMetricsPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ['*'],
          actions: ['cloudwatch:PutMetricData'],
        }),
      ],
    });

    // iam policy to access the application jar from S3 as well as to write to S3
    const accessS3Policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [`arn:aws:s3:::${cfnParams.get("BucketName")!.valueAsString}/*`],
          actions: ['s3:ListBucket',
                    's3:PutObject',
                    's3:GetObject',
                    's3:DeleteObject'
                    ],
        }),
      ],
    });

    // iam policy to read from the source kinesis data stream
    const accessKdsPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [kinesisStream.streamArn],
          actions: ['kinesis:DescribeStream',
                    'kinesis:GetShardIterator',
                    'kinesis:GetRecords',
                    'kinesis:PutRecord',
                    'kinesis:PutRecords',
                    'kinesis:ListShards']
        }),
      ],
    });

    // iam role to run the flink application
    const appRole = new iam.Role(this, 'flink-app-role', {
      roleName: cfnParams.get("RoleName")!.valueAsString,
      assumedBy: new iam.ServicePrincipal('kinesisanalytics.amazonaws.com'),
      description: 'Flink application role',
      inlinePolicies: {
        AccessKDSPolicy: accessKdsPolicy,
        AccessCWLogsPolicy: accessCWLogsPolicy,
        AccessCWMetricsPolicy: accessCWMetricsPolicy,
        AccessS3Policy: accessS3Policy,
      },
    });

    const flinkApplicationProps = {
      "StackId": this.stackId,
      "BlueprintName": "FLINK-SCALA-KINESIS-TO-S3",
      "StreamName": kinesisStream.streamName,
      "BucketName": `s3://${cfnParams.get("BucketName")!.valueAsString}/`,
      "AWSRegion": this.region,
      "StreamInitialPosition": "TRIM_HORIZON",
      "PartitionFormat": "yyyy-MM-dd-HH",
      "BootstrapStackName": cfnParams.get("BootstrapStackName")!.valueAsString,
    };

    const app = new MsfScalaApp(this, "kinesis-to-s3-scala-app", {
      account: this.account,
      region: this.region,
      partition: this.partition,
      appName: cfnParams.get("AppName")!.valueAsString,
      runtimeEnvironment: MsfRuntimeEnvironment.FLINK_1_17,
      serviceExecutionRole: appRole.roleArn,
      bucketName: cfnParams.get("BucketName")!.valueAsString,
      jarFile: cfnParams.get("JarFile")!.valueAsString,
      logStreamName:  logStream.logStreamName,
      logGroupName: logGroup.logGroupName, 
      applicationProperties: flinkApplicationProps,
    });

    // configure app start lambda to automatically start the flink app
    const appStartLambdaFnConstruct = new AppStartLambdaConstruct(this, 'AppStartLambda', {
      account: this.account,
      region: this.region,
      appName: cfnParams.get("AppName")!.valueAsString
    });

    const appStartCustomResource = new cdk.CustomResource(this, 'AppStartLambdaResource', {
      serviceToken: appStartLambdaFnConstruct.appStartLambdaFn.functionArn,
      properties:
      {
        AppName: cfnParams.get("AppName")!.valueAsString
,
      }
    });

    appStartCustomResource.node.addDependency(app);

    // 👇 create an output for app start response
    const response = appStartCustomResource.getAtt('Message').toString();
    const appStartResponseOutput = new cdk.CfnOutput(this, 'AppStartResponseOutput', {
      value: response,
    });

    appStartResponseOutput.node.addDependency(appStartLambdaFnConstruct.appStartLambdaFn);
    appStartResponseOutput.node.addDependency(appStartCustomResource);

    new KdsDataGenLambdaConstruct(this, "KdsDataGenLambda", {
      streamArn: kinesisStream.streamArn,
      numberOfItems: cfnParams.get("NumberOfItems")!.valueAsNumber,
    })

  }

  getParams(): Map<string, cdk.CfnParameter> {
    let params = new Map<string, cdk.CfnParameter>();

    params.set("AppName", new cdk.CfnParameter(this, "AppName", {
      type: "String",
      description: "Flink application name"
    }));

    params.set("BucketName", new cdk.CfnParameter(this, "BucketName", {
      type: "String",
      description: "The S3 bucket where the application payload will be stored (must exist)"
    }));

    params.set("StreamName", new cdk.CfnParameter(this, "StreamName", {
      type: "String",
      description: "The name of the Kinesis Data Stream"
    }));

    params.set("RoleName", new cdk.CfnParameter(this, "RoleName", {
      type: "String",
      description: "Name of IAM role used to run the Flink application"
    }));

    params.set("CloudWatchLogGroupName", new cdk.CfnParameter(this, "CloudWatchLogGroupName", {
      type: "String",
      description: "The log group name for the Flink application"
    }));

    params.set("CloudWatchLogStreamName", new cdk.CfnParameter(this, "CloudWatchLogStreamName", {
      type: "String",
      description: "The log stream name for the Flink application"
    }));

    params.set("BootstrapStackName", new cdk.CfnParameter(this, "BootstrapStackName", {
      type: "String",
      description: "Name of bootstrap stack used to create this blueprint"
    }));

    params.set("JarFile", new cdk.CfnParameter(this, "JarFile", {
      type: "String",
      default: "kds-to-s3-datastream-Scala-1.0.1.jar",
      description: "S3 key for .jar file containing the app (must exist in bucket specified in BucketName parameter)"
    }));

    params.set("RuntimeEnvironment", new cdk.CfnParameter(this, "RuntimeEnvironment", {
      type: "String",
      default: "FLINK-1_17",
      description: "Flink runtime environment"
    }));

    params.set("RetentionPeriodHours", new cdk.CfnParameter(this, "RetentionPeriodHours", {
      type: "Number",
      default: 90 * 24,
      description: "Time to retain data in Kinesis Data Stream in hours"
    }));

    params.set("NumberOfItems", new cdk.CfnParameter(this, "NumberOfItems", {
      type: "Number",
      default: 10000,
      description: "Number of test data items to generate"
    }));

    return params;
  }
}