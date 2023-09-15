import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MsfJavaAppStack } from '../lib/msf-java-app-infrastructure-construct';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';

const app = new cdk.App();

new MsfJavaAppStack(app, 'CdkInfraMSFKdsToS3Stack', {
  synthesizer: new BootstraplessStackSynthesizer({
    templateBucketName: 'cfn-template-bucket',
    fileAssetBucketName: 'file-asset-bucket-${AWS::Region}',
    fileAssetRegionSet: ['us-west-1', 'us-west-2'],
    fileAssetPrefix: 'file-asset-prefix/latest/'
  }),
});