import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type LogDocument = HydratedDocument<Log>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Log {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id?: string;
  @Prop()
  ip?: string;
  @Prop()
  userAgent?: string;
  @Prop()
  method?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  headers?: any;
  @Prop()
  url?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  body?: any;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  query?: any;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  params?: any;
  @Prop()
  className?: string;
  @Prop()
  methodName?: string;
  @Prop()
  username?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  response?: any;
  @Prop()
  createdAt?: Date;
  @Prop()
  isError?: boolean;
}

export const LogSchema = SchemaFactory.createForClass(Log);
