import * as cdk from 'aws-cdk-lib';
import * as core from 'aws-cdk-lib';
import { CfnOutput, NestedStackProps } from "aws-cdk-lib";
import { Construct } from 'constructs';
import { aws_kinesis as kinesis } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_s3 as s3 } from 'aws-cdk-lib';

export interface MsfInfraProps extends NestedStackProps {
  readonly streamName: string,
  readonly bucketName: string;
  readonly roleName: string;
  readonly cloudWatchLogGroupName: string;
  readonly cloudWatchLogStreamName: string;
  readonly retentionPeriodHours: number;
}

export class MsfInfra extends core.NestedStack {
  public logGroup: logs.LogGroup
  public logStream: logs.LogStream
  public kinesisStream: kinesis.Stream
  public s3Bucket: s3.Bucket
  constructor(scope: Construct, id: string, props: MsfInfraProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: props.cloudWatchLogGroupName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.logStream = new logs.LogStream(this, 'LogStream', {
      logStreamName: props.cloudWatchLogStreamName,
      logGroup: this.logGroup,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.kinesisStream = new kinesis.Stream(this, 'SourceKinesisStream', {
      streamName: props.streamName,
      streamMode: kinesis.StreamMode.ON_DEMAND,
      retentionPeriod: cdk.Duration.hours(props.retentionPeriodHours),
    });

    this.s3Bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })
    new CfnOutput(this, 'LogGroupArn', { value: this.logGroup.logGroupArn })
    new CfnOutput(this, 'LogStreamName', { value: this.logStream.logStreamName })
    new CfnOutput(this, 'KinesisStreamArn', { value: this.kinesisStream.streamArn })
    new CfnOutput(this, 'S3BucketArn', {value: this.s3Bucket.bucketArn })
  }
}