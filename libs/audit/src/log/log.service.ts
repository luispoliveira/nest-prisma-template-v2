import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Log } from "../schemas/log.schema";
@Injectable()
export class LogService {
  constructor(@InjectModel(Log.name) private LogModel: Model<Log>) {}

  async create(log: Log): Promise<Log> {
    const createdLog = new this.LogModel({
      ...log,
    });
    return await createdLog.save();
  }

  async update(id: string, log: Partial<Log>): Promise<Log | null> {
    return await this.LogModel.findByIdAndUpdate(id, log, {
      new: true,
      useFindAndModify: false,
    });
  }
}
