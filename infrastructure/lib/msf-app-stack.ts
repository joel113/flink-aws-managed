import * as core from 'aws-cdk-lib'
import * as flink from '@aws-cdk/aws-kinesisanalytics-flink-alpha'
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { NestedStackProps, aws_logs as logs } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface MsfAppProps extends NestedStackProps {
  readonly logGroupArn: string;
  readonly bucketArn: string;
  readonly streamArn: string;
  readonly roleName: string;
  readonly appName: string;
  readonly streamName: string,
  readonly region: string;
  readonly streamInitialPosition: string,
  readonly bucketName: string;
  readonly jarFile: string;
  readonly runtime: flink.Runtime,
  readonly logGroup: logs.ILogGroup,
}

export class MsfApp extends core.NestedStack {
  constructor(scope: Construct, id: string, props: MsfAppProps) {
      super(scope, id);

      const accessCWLogsPolicy = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            resources: [props.logGroupArn],
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
            resources: [props.bucketArn],
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
            resources: [props.streamArn],
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
        roleName: props.roleName,
        assumedBy: new iam.ServicePrincipal('kinesisanalytics.amazonaws.com'),
        description: 'Flink application role',
        inlinePolicies: {
          AccessKDSPolicy: accessKdsPolicy,
          AccessCWLogsPolicy: accessCWLogsPolicy,
          AccessCWMetricsPolicy: accessCWMetricsPolicy,
          AccessS3Policy: accessS3Policy,
        },
      });

      new flink.Application(this, props.appName, {
        applicationName: props.appName,
        runtime: props.runtime,
        code: flink.ApplicationCode.fromAsset(path.join(__dirname, props.jarFile)),
        role: appRole,
        logGroup: props.logGroup,
        propertyGroups: {
          FlinkApplicationProperties: {
            streamName: props.streamName,
            streamInitialPosition: props.streamInitialPosition,
            bucketName: props.bucketName,
            region: props.region,
          }
        }
      });
    }
  }