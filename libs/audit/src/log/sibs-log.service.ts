import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SibsLog } from '../schemas/sibs-log.schema';
@Injectable()
export class SibsLogService {
  constructor(
    @InjectModel(SibsLog.name) private _SibsLogModel: Model<SibsLog>,
  ) {}

  async create(log: SibsLog): Promise<SibsLog> {
    const createdLog = new this._SibsLogModel({
      ...log,
    });
    return await createdLog.save();
  }

  async update(id: string, log: Partial<SibsLog>): Promise<SibsLog | null> {
    return await this._SibsLogModel.findByIdAndUpdate(id, log, {
      new: true,
      useFindAndModify: false,
    });
  }
}
