import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SibsLogDocument = HydratedDocument<SibsLog>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class SibsLog {
  @Prop({ type: mongoose.Schema.Types.ObjectId, auto: true })
  _id?: string;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  request: any;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  response?: any;
  @Prop()
  createdAt?: Date;
  @Prop()
  updatedAt?: Date;
  @Prop()
  isError?: boolean;
}

export const SibsLogSchema = SchemaFactory.createForClass(SibsLog);
