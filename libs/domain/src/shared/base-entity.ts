export abstract class BaseEntity {
  protected constructor(
    protected readonly _id: number,
    protected readonly _createdAt: Date,
    protected readonly _updatedAt: Date,
  ) {}

  get id(): number {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected equals(entity: BaseEntity): boolean {
    return this._id === entity._id;
  }

  abstract toPersistence(): Record<string, any>;
}
