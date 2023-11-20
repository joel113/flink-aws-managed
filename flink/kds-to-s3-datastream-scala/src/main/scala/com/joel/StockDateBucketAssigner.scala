package com.joel

import org.apache.flink.core.io.SimpleVersionedSerializer
import org.apache.flink.streaming.api.functions.sink.filesystem.BucketAssigner
import org.apache.flink.streaming.api.functions.sink.filesystem.bucketassigners.SimpleVersionedStringSerializer

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class StockDateBucketAssigner(partitionFormat: String, prefix: String) extends BucketAssigner[Stock, String] {
  override def getBucketId(in: Stock, context: BucketAssigner.Context): String = {
    val dtFormatForWrite = DateTimeFormatter.ofPattern(partitionFormat)
    val eventTimeStr = in.time
    val eventTime = LocalDateTime.parse(eventTimeStr.replace(" ", "T"))
    val formattedDate = eventTime.format(dtFormatForWrite)
    String.format("%sts=%s", prefix, formattedDate)
  }
  override def getSerializer: SimpleVersionedSerializer[String] = SimpleVersionedStringSerializer.INSTANCE
}
