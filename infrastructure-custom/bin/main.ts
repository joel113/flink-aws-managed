import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MsfStack } from '../lib/msf-stack-construct';
import { BootstraplessStackSynthesizer } from 'cdk-bootstrapless-synthesizer';

const app = new cdk.App();

new MsfStack(app, 'CdkInfraMSFKdsToS3Stack', {
  synthesizer: new BootstraplessStackSynthesizer({
    templateBucketName: 'msf-cfn-template-bucket',
    fileAssetBucketName: 'msf-bucket-${AWS::Region}',
    fileAssetRegionSet: ['eu-central-1'],
    fileAssetPrefix: 'msf/latest/'
  }),
});