export abstract class ValueObject<T> {
  protected constructor(protected readonly _props: T) {}

  public equals(vo: ValueObject<T>): boolean {
    return JSON.stringify(this._props) === JSON.stringify(vo._props);
  }

  get value(): T {
    return this._props;
  }
}
