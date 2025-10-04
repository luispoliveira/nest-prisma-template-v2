export interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventName: string;
  readonly aggregateId: string | number;
  readonly eventVersion: number;
  readonly eventData: Record<string, any>;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventVersion: number = 1;

  protected constructor(
    public readonly aggregateId: string | number,
    public readonly eventName: string,
    public readonly eventData: Record<string, any> = {},
  ) {
    this.occurredOn = new Date();
  }
}
