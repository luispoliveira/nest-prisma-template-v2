import { BaseDomainEvent } from '../../shared/domain-event';

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(userId: number, email: string) {
    super(userId, 'UserCreated', { email });
  }
}
