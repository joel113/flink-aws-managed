import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MsfStack } from '../lib/msf-stack-construct';
import * as flink from '@aws-cdk/aws-kinesisanalytics-flink-alpha'
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';

const app = new cdk.App();

new MsfStack(app, 'MsfKdsToS3Stack', {
  appName: "msf-kds-to-s3-app",
  bucketName: "msf-kds-bucket",
  roleName: "msf-kds-to-s3-role",
  cloudWatchLogGroupName: "msf-kds-to-s3-cwgroup",
  cloudWatchLogStreamName: "msf-kds-to-s3-cwlog",
  bootstrapStackName: "msf-kds-to-s3-stackname",
  jarFile: "../../flink/kds-to-s3-datastream-scala/target/kds-to-s3-datastream-scala-1.0.0.jar",
  runtime: flink.Runtime.FLINK_1_15,
  streamName: "msf-kds-to-s3-streamname",
  retentionPeriodHours: 24,
  numberOfItems: 100,
  synthesizer: new BootstraplessStackSynthesizer({
    templateBucketName: 'msf-cfn-template-bucket',
    fileAssetBucketName: 'msf-bucket-${AWS::Region}',
    fileAssetRegionSet: ['eu-central-1'],
    fileAssetPrefix: 'msf/latest/'
  }),
});

app.synth;