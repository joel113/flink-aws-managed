import * as cdk from 'aws-cdk-lib';
import * as core from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { NestedStackProps } from "aws-cdk-lib";
import { Construct } from 'constructs';

export interface MsfIamProps extends NestedStackProps {
  readonly logGroupArn: string;
  readonly bucketArn: string;
  readonly streamArn: string;
  readonly roleName: string;
}

export class MsfIam extends core.NestedStack {
  public appRole: iam.Role;
  constructor(scope: Construct, id: string, props: MsfIamProps) {
    super(scope, id);

    // iam policy to allow to write logs into the log groups
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
    this.appRole = new iam.Role(this, 'flink-app-role', {
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
    new cdk.CfnOutput(this, 'IAMRoleARN', {value: this.appRole.roleArn })
  }

} 