package com.joel

import com.amazonaws.services.kinesisanalytics.flink.connectors.config.AWSConfigConstants
import com.amazonaws.services.kinesisanalytics.runtime.KinesisAnalyticsRuntime
import org.apache.avro.Schema
import org.apache.avro.reflect.ReflectData
import org.apache.flink.api.common.RuntimeExecutionMode
import org.apache.flink.connector.file.sink.FileSink
import org.apache.flink.core.fs.Path
import org.apache.flink.formats.parquet.{ParquetBuilder, ParquetWriterFactory}
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment
import org.apache.flink.streaming.api.functions.sink.filesystem.rollingpolicies.OnCheckpointRollingPolicy
import org.apache.flink.streaming.connectors.kinesis.FlinkKinesisConsumer
import org.apache.flink.streaming.connectors.kinesis.config.ConsumerConfigConstants
import org.apache.flink.util.Collector
import org.apache.parquet.avro.AvroParquetWriter
import org.apache.parquet.hadoop.ParquetWriter
import org.apache.parquet.hadoop.metadata.CompressionCodecName
import org.apache.parquet.io.OutputFile
import org.slf4j.LoggerFactory

import java.util.Properties
import scala.reflect.classTag

object StreamPipeline {

  private final val LOG = LoggerFactory.getLogger(StreamPipeline.getClass)
  private final val FLINK_APPLICATION_PROPERTIES = "BluePrintMetadata"
  private final val KINESIS_STREAM_NAME = "streamName"
  private final val AWS_REGION = "region"
  private final val STREAM_INITIAL_POSITION = "streamInitialPosition"
  private final val S3_DEST_KEY = "bucketName"

  private def getAppProperties: Option[Properties] = {
    val applicationProperties = KinesisAnalyticsRuntime.getApplicationProperties()
    val flinkProperties = applicationProperties.get(FLINK_APPLICATION_PROPERTIES)
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
    else {
      Some(flinkProperties)
    }
  }

  private def getKinesisSource(properties: Option[Properties]): FlinkKinesisConsumer[Stock] = {
    val streamName = properties match {
      case Some(value) => value.get(KINESIS_STREAM_NAME).toString
      case None =>
        LOG.error("Unable to set property " + KINESIS_STREAM_NAME)
        throw new RuntimeException(KINESIS_STREAM_NAME + " property not available")
    }
    val deserializationSchema = new StockDeserializationSchema()
    val consumerConfig = new Properties()
    consumerConfig.put(AWSConfigConstants.AWS_REGION, properties match {
      case Some(value) => value.get(AWS_REGION)
      case None => "eu-central-1"
    })
    consumerConfig.put(ConsumerConfigConstants.STREAM_INITIAL_POSITION, properties match {
      case Some(value) => value.get(STREAM_INITIAL_POSITION)
      case None => "TRIM_HORIZON"
    })
    new FlinkKinesisConsumer[Stock](streamName, deserializationSchema, consumerConfig)
  }

  private def getParquetWriter = {
    new ParquetWriterFactory[Stock](new ParquetBuilder[Stock] {
      val schema: Schema = ReflectData.AllowNull.get().getSchema(classTag[Stock].runtimeClass)
      override def createWriter(out: OutputFile): ParquetWriter[Stock] = {
        AvroParquetWriter
          .builder[Stock](out)
          .withSchema(schema)
          .withDataModel(ReflectData.AllowNull.get())
          .withCompressionCodec(CompressionCodecName.SNAPPY)
          .build()
      }
    })
  }

  private def getFileSink: FileSink[Stock] = {
    val outputPath = "/tmp/flinkout"
    val partitionFormat = "yyyy-MM-dd-HH"
    val path = new Path(outputPath)
    val prefix = String.format("%sjob_start=%s/", "app-msf-kds-to-s3", System.currentTimeMillis.toString)
    val bucketAssigner = new StockDateBucketAssigner(partitionFormat, prefix)
    FileSink
      .forBulkFormat(path, getParquetWriter)
      .withBucketAssigner(bucketAssigner)
      .withRollingPolicy(OnCheckpointRollingPolicy.build())
      .build()
  }

  private def runAppWithKinesisSource(env: StreamExecutionEnvironment, properties: Option[Properties]): Unit = {
    val source = getKinesisSource(properties)
    val stream = env.addSource(source)
    val sink = getFileSink
    stream.flatMap((stock: Stock, collector: Collector[Stock]) => {
      if (stock.price >= 1) {
        collector.collect(stock)
      }
    }).sinkTo(sink)
  }

  def main(args: Array[String]): Unit = {
    implicit val env: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
    env.setRuntimeMode(RuntimeExecutionMode.STREAMING)
    val appProperties = getAppProperties
    runAppWithKinesisSource(env, appProperties)
    env.execute("Kinesis Data Streams to S3 Flink Streaming Job")
  }
}