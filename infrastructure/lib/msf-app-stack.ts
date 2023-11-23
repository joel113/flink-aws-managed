import * as path from 'path';
import * as core from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam';
import { aws_logs as logs } from 'aws-cdk-lib';
import { NestedStackProps } from "aws-cdk-lib";
import * as flink from '@aws-cdk/aws-kinesisanalytics-flink-alpha'
import { Construct } from 'constructs';

export interface MsfAppProps extends NestedStackProps {
  readonly appName: string;
  readonly streamName: string,
  readonly region: string;
  readonly streamInitialPosition: string,
  readonly bucketName: string;
  readonly jarFile: string;
  readonly runtime: flink.Runtime,
  readonly role: iam.Role,
  readonly logGroup: logs.ILogGroup,
}

export class MsfApp extends core.NestedStack {
  constructor(scope: Construct, id: string, props: MsfAppProps) {
      super(scope, id);
      new flink.Application(this, props.appName, {
        applicationName: props.appName,
        runtime: props.runtime,
        code: flink.ApplicationCode.fromAsset(path.join(__dirname, props.jarFile)),
        role: props.role,
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