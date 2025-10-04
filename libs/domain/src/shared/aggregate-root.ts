import { BaseEntity } from './base-entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot extends BaseEntity {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public markEventsForDispatch(): void {
    // This method can be used to mark events as ready for dispatch
  }
}
