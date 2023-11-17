package com.joel

import com.amazonaws.services.kinesisanalytics.runtime.KinesisAnalyticsRuntime
import org.apache.flink.api.common.RuntimeExecutionMode
import org.apache.flink.streaming.api.datastream.DataStream
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import org.slf4j.LoggerFactory

import java.util.Properties

object StreamingJob {

  private final val LOG = LoggerFactory.getLogger(StreamingJob.getClass)
  private final val FLINK_APPLICATION_PROPERTIES = "BluePrintMetadata"
  private final val KINESIS_STREAM_NAME = "StreamName"
  private final val AWS_REGION = "AWSRegion"
  private final val STREAM_INITIAL_POSITION = "StreamInitialPosition"
  private final val S3_DEST_KEY = "BucketName"
  private final val SINK_PARALLELISM_KEY = "SinkParallelism"
  private final val PARTITION_FORMAT_KEY = "PartitionFormat"

  def getAppProperties: Option[Properties] = {
    val applicationProperties = KinesisAnalyticsRuntime.getApplicationProperties()
    val flinkProperties = applicationProperties.get(FLINK_APPLICATION_PROPERTIES);
    if(flinkProperties == null) {
      LOG.error("Unable to receive FLINK_APPLICATION_PROPERTIES.")
      None
    }
    else if(!flinkProperties.containsKey(KINESIS_STREAM_NAME)) {
      LOG.error("Unable to retrieve property " + KINESIS_STREAM_NAME)
      None
    }
    else if(!flinkProperties.containsKey(AWS_REGION)) {
      LOG.error("Unable to retrieve property " + AWS_REGION)
      None
    }
    else if(!flinkProperties.containsKey(STREAM_INITIAL_POSITION)) {
      LOG.error("Unable to retrieve property " + STREAM_INITIAL_POSITION)
      None
    }
    else if(!flinkProperties.containsKey(S3_DEST_KEY)) {
      LOG.error("Unable to retrieve property " + S3_DEST_KEY)
      None
    }
    else if(!flinkProperties.containsKey(PARTITION_FORMAT_KEY)) {
      LOG.error("Unable to retrieve property " + PARTITION_FORMAT_KEY)
      None
    }
    else {
      Some(flinkProperties)
    }
  }

  def runAppWithKinesisSource(env: StreamExecutionEnvironment, properties: Properties) = {
    FlinkKinesisConsumer<Stock> stockSource = ???
    DataStream<Stock> stockStream = ???
      ...
  }

  def main(args: Array[String]): Unit = {

    implicit val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
    env.setRuntimeMode(RuntimeExecutionMode.STREAMING)

    val appProperties = getAppProperties();

    runAppWithKinesisSource(env, appProperties)

    env.execute("Kinesis Data Streams to S3 Flink Straming Job")
  }

}