package com.joel

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.flink.api.common.serialization.AbstractDeserializationSchema
import org.apache.flink.util.Collector

import java.lang.reflect.{ParameterizedType, Type}
import java.nio.charset.StandardCharsets;

object StockDeserializationSchema {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)

  def serialize(value: Any): String = {
    import java.io.StringWriter
    val writer = new StringWriter()
    mapper.writeValue(writer, value)
    writer.toString
  }

  def deserialize[T: Manifest](value: String): T = {
    mapper.readValue(value, typeReference[T])
  }

  private[this] def typeReference[T: Manifest] = new TypeReference[T] {
    override def getType: Type = typeFromManifest(manifest[T])
  }

  private[this] def typeFromManifest(m: Manifest[_]): Type = {
    if (m.typeArguments.isEmpty) {
      m.runtimeClass
    }
    else new ParameterizedType {
      def getRawType: Class[_] = m.runtimeClass
      def getActualTypeArguments: Array[Type] = m.typeArguments.map(typeFromManifest).toArray
      def getOwnerType: Type = null
    }
  }
}

class StockDeserializationSchema extends AbstractDeserializationSchema[Stock] {
  override def deserialize(bytes: Array[Byte], out: Collector[Stock]): Unit = StockDeserializationSchema.deserialize(new String(bytes, StandardCharsets.UTF_16))
  override def deserialize(bytes: Array[Byte]): Stock = StockDeserializationSchema.deserialize(new String(bytes, StandardCharsets.UTF_16))
}
