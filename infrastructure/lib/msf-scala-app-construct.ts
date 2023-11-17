import * as path from 'path';
import * as core from 'aws-cdk-lib'
import { StackProps } from "aws-cdk-lib";
import * as flink from '@aws-cdk/aws-kinesisanalytics-flink-alpha'
import { Construct } from 'constructs';

export enum MsfRuntimeEnvironment {
  FLINK_1_17 = "FLINK-1_17"
}

export interface MsfScalaAppProps extends StackProps {
  account: string;
  region: string;
  partition: string;
  appName: string;
  runtimeEnvironment: MsfRuntimeEnvironment,
  serviceExecutionRole: string;
  bucketName: string;
  jarFile: string;
  logStreamName: string;
  logGroupName: string;
  subnets?: string[];
  securityGroups?: string[];
  parallelism?: Number;
  parallelismPerKpu?: Number;
  autoscalingEnabled?: Boolean;
  checkpointInterval?: Number;
  minPauseBetweenCheckpoints?: Number;
  applicationProperties?: Object;
}

export class MsfScalaApp extends Construct {
  constructor(scope: Construct, id: string, props: MsfScalaAppProps) {
      super(scope, id);

      const app = new core.App();
      const stack = new core.Stack(app, 'MsfScalaApp');

      new flink.Application(stack, 'MsfScalaApp', {
        code: flink.ApplicationCode.fromAsset(path.join(__dirname, '../../flink/target/foobar.jar')),
        runtime: flink.Runtime.FLINK_1_15,
      });

      app.synth();
    }
  }