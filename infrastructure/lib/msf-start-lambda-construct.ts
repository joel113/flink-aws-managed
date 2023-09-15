import { readFileSync } from "fs";
import { StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface AppStartLambdaConstructProps extends StackProps {
    account: string,
    region: string,
    appName: string,
}

export class AppStartLambdaConstruct extends Construct {
    public appStartLambdaFn: lambda.SingletonFunction;

    constructor(scope: Construct, id: string, props: AppStartLambdaConstructProps) {
        super(scope, id);


        // Run app start lambda
        this.appStartLambdaFn = new lambda.SingletonFunction(this, 'AppStartFunction', {
            uuid: '97e4f730-4ee1-11e8-3c2d-fa7ae01b6ebc',
            lambdaPurpose: "Start MSF Application",
            code: lambda.Code.fromInline(readFileSync(`${__dirname}/../../../python/lambda_msf_app_start.py`, "utf-8")),
            handler: "index.handler",
            initialPolicy: [
                new iam.PolicyStatement(
                    {
                        actions: ['kinesisanalytics:DescribeApplication',
                            'kinesisanalytics:StartApplication',],

                        resources: ['arn:aws:kinesisanalytics:' + props.region + ':' + props.account + ':application/' + props.appName]
                    })
            ],
            timeout: cdk.Duration.seconds(600),
            runtime: lambda.Runtime.PYTHON_3_9,
            memorySize: 1024, // need extra memory for kafka-client
        });
      }
}