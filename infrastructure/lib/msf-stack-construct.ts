import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MsfApp } from './msf-app-stack';
import * as flink from '@aws-cdk/aws-kinesisanalytics-flink-alpha'
import { MsfInfra } from './msf-infra-stack';
import { MsfIam } from './msf-iam-stack';

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
    const msfIam = new MsfIam(this, "MsfIam", {
      logGroupArn: msfInfra.logGroup.logGroupArn,
      bucketArn: msfInfra.s3Bucket.bucketArn,
      streamArn: msfInfra.kinesisStream.streamArn,
      roleName: props.roleName,
    });
    new MsfApp(this, "kinesis-to-s3-scala-app", {
      appName: props.appName,
      streamName: props.streamName,
      region: this.region,
      streamInitialPosition: "TRIM_HORIZON",
      bucketName: props.bucketName,
      jarFile: props.jarFile,
      runtime: props.runtime,
      role: msfIam.appRole,
      logGroup: msfInfra.logGroup, 
    });
  }
}