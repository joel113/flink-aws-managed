import {readFileSync} from 'fs';
import { StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export interface KdsDataGenLambdaConstructProps extends StackProps {
    streamArn: string,
    numberOfItems: number,
}

export class KdsDataGenLambdaConstruct extends Construct {
    public kdsDataGenLambdaFn: lambda.SingletonFunction;

    constructor(scope: Construct, id: string, props: KdsDataGenLambdaConstructProps) {
        super(scope, id);

        // Run KDS DataGen Lambda
        this.kdsDataGenLambdaFn = new lambda.SingletonFunction(this, 'KdsDataGenFunction', {
            uuid: "e7e4ed0b-1438-4552-94ae-5edfb84ac21c",
            code: lambda.Code.fromInline(readFileSync(`${__dirname}/../python/lambda_kds_datagen.py`, "utf-8")),
            handler: "index.handler",
            initialPolicy: [
                new iam.PolicyStatement(
                    {
                        actions: ["kinesis:PutRecord"],
                        resources: [props.streamArn]
                    })
            ],
            timeout: cdk.Duration.seconds(300),
            runtime: lambda.Runtime.PYTHON_3_9,
            memorySize: 1024,
        });

        const resource = new cdk.CustomResource(this, 'KdsDataGenResource', {
            serviceToken: this.kdsDataGenLambdaFn.functionArn,
            properties: {
                StreamArn: props.streamArn,
                NumberOfItems: props.numberOfItems
            }
          });

          resource.node.addDependency(this.kdsDataGenLambdaFn);
    }
}