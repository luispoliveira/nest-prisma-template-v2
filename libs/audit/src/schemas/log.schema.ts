import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type LogDocument = HydratedDocument<Log>;

@Schema()
export class Log {
  @Prop({ type: mongoose.Schema.Types.ObjectId })
  _id?: string;
  @Prop()
  ip?: string;
  @Prop()
  userAgent?: string;
  @Prop()
  method?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  headers?: Record<string, unknown>;
  @Prop()
  url?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  body?: Record<string, unknown>;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  query?: Record<string, unknown>;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  params?: Record<string, unknown>;
  @Prop()
  className?: string;
  @Prop()
  methodName?: string;
  @Prop()
  username?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  response?: Record<string, unknown>;
  @Prop()
  createdAt?: Date;
  @Prop()
  isError?: boolean;
}

export const LogSchema = SchemaFactory.createForClass(Log);
