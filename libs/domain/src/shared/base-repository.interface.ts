export interface BaseRepository<T, ID> {
  findById(_id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(_entity: T): Promise<T>;
  update(_entity: T): Promise<T>;
  delete(_id: ID): Promise<void>;
  exists(_id: ID): Promise<boolean>;
}
