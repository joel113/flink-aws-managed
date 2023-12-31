import * as cdk from 'aws-cdk-lib';
import * as flink from '@aws-cdk/aws-kinesisanalytics-flink-alpha'
import { Construct } from 'constructs';
import { MsfApp } from './msf-app-stack';
import { MsfInfra } from './msf-infra-stack';
import { StackProps } from 'aws-cdk-lib';

export interface MsfStackProps extends StackProps {
  readonly appName: string;
  readonly bucketName: string;
  readonly roleName: string;
  readonly cloudWatchLogGroupName: string;
  readonly cloudWatchLogStreamName: string;
  readonly bootstrapStackName: string;
  readonly jarFile: string;
  readonly runtime: flink.Runtime;
  readonly streamName: string,
  readonly retentionPeriodHours: number;
  readonly numberOfItems: number;
}

export class MsfStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MsfStackProps) {
    super(scope, id, props);
    const msfInfra = new MsfInfra(this, "MsfInfra", {
      streamName: props.streamName,
      bucketName: props.bucketName,
      roleName: props.roleName,
      cloudWatchLogGroupName: props.cloudWatchLogGroupName,
      cloudWatchLogStreamName: props.cloudWatchLogStreamName,
      retentionPeriodHours: props.retentionPeriodHours,
    });
    new MsfApp(this, "kinesis-to-s3-scala-app", {
      logGroupArn: msfInfra.logGroup.logGroupArn,
      bucketArn: msfInfra.s3Bucket.bucketArn,
      streamArn: msfInfra.kinesisStream.streamArn,
      roleName: props.roleName,
      appName: props.appName,
      streamName: props.streamName,
      region: this.region,
      streamInitialPosition: "TRIM_HORIZON",
      bucketName: props.bucketName,
      jarFile: props.jarFile,
      runtime: props.runtime,
      logGroup: msfInfra.logGroup, 
    });
  }
}