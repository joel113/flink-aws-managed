# Flink AWS Managed

This project is based on the Manged Service for Apache Flink blueprint project. The project creates a managed flink application using python scripts.

CDK has also an [official support to setup a managed flink application](https://docs.aws.amazon.com/cdk/api/v2/docs/@aws-cdk_aws-kinesisanalytics-flink-alpha.Application.html), which is not used in this application.

## AWS Managed Flink

https://aws.amazon.com/de/managed-service-apache-flink/getting-started/?nc=sn&loc=4

https://docs.aws.amazon.com/managed-flink/latest/apiv2/Welcome.html

https://docs.aws.amazon.com/managed-flink/latest/java/flink-1-15-2.html

https://docs.aws.amazon.com/cli/latest/reference/kinesisanalyticsv2/

https://docs.aws.amazon.com/cdk/api/v2/docs/aws-kinesisanalytics-flink-alpha-readme.html

### Custom Metrics

https://docs.aws.amazon.com/managed-flink/latest/java/monitoring-metrics-custom.html#monitoring-metrics-custom-examples-viewing

## AWS Managed Flink Github Repos

https://github.com/aws-samples/amazon-kinesis-data-analytics-examples.git

https://github.com/awslabs/managed-service-for-apache-flink-blueprints/tree/main

https://github.com/awslabs/managed-service-for-apache-flink-blueprints/blob/main/apps/java-datastream/kds-to-s3-datastream-java/cdk-infra/lib/cdk-infra-kds-to-s3-stack.ts

## AWS CDK

https://github.com/aws-samples/aws-cdk-examples/tree/master

https://github.com/aws-samples/cdk-bootstrapless-synthesizer

## Streaming with Flink

https://github.com/streaming-with-flink

https://github.com/streaming-with-flink/examples-scala

https://docs.aws.amazon.com/managed-flink/latest/java/how-sources.html

## AWS Managed Flink

https://aws.amazon.com/de/managed-service-apache-flink/

https://docs.aws.amazon.com/managed-flink/latest/java/getting-started.html

```text
java.util.concurrent.CompletionException: org.apache.flink.client.program.ProgramInvocationException: The program's entry point class 'com.amazonaws.services.kinesisanalytics.StreamingJob' was not found in the jar file.
at org.apache.flink.runtime.webmonitor.handlers.JarRunOverrideHandler.handleRequest(JarRunOverrideHandler.java:262)
at org.apache.flink.runtime.webmonitor.handlers.JarRunOverrideHandler.handleRequest(JarRunOverrideHandler.java:88)
at org.apache.flink.runtime.rest.handler.AbstractRestHandler.respondToRequest(AbstractRestHandler.java:83)
at org.apache.flink.runtime.rest.handler.AbstractHandler.respondAsLeader(AbstractHandler.java:195)
at org.apache.flink.runtime.rest.handler.LeaderRetrievalHandler.lambda$channelRead0$0(LeaderRetrievalHandler.java:83)
at java.base/java.util.Optional.ifPresent(Optional.java:183)
```

## AWS Managed Flink with CDK

https://docs.aws.amazon.com/cdk/api/v2/docs/aws-kinesisanalytics-flink-alpha-readme.html

## AWS CDK

https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript

https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html

https://github.com/aws-samples/cdk-bootstrapless-synthesizer

## AWS CDK Stack and Stage Boundaries

https://stackoverflow.com/questions/73177926/dependency-cannot-cross-stage-boundaries

https://stackoverflow.com/questions/72872863/what-are-the-tradeoffs-between-nestedstacks-and-constructs

https://github.com/aws/aws-cdk/issues/11360

https://medium.com/swlh/aws-cdk-pipelines-real-world-tips-and-tricks-part-1-544601c3e90b

https://stackoverflow.com/questions/69821387/cdk-pipelines-use-stack-output-in-poststep-of-stage

https://stackoverflow.com/questions/61579756/aws-cdk-how-do-i-reference-cross-stack-resources-in-same-app

## Q&A

https://www.baeldung.com/scala/convert-byte-array-to-string

https://stackoverflow.com/questions/12591457/scala-2-10-json-serialization-and-deserialization

https://stackoverflow.com/questions/28270621/using-jackson-to-de-serialize-a-scala-case-class
