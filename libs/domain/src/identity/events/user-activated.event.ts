import { BaseDomainEvent } from '../../shared/domain-event';

export class UserActivatedEvent extends BaseDomainEvent {
  constructor(userId: number, email: string) {
    super(userId, 'UserActivated', { email });
  }
}
