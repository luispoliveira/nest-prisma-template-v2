import { AggregateRoot } from '../../shared/aggregate-root';

export interface RoleProps {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Role extends AggregateRoot {
  private constructor(private readonly props: RoleProps) {
    super(props.id, props.createdAt, props.updatedAt);
  }

  public static create(name: string): Role {
    const now = new Date();
    const roleProps: RoleProps = {
      id: 0, // Will be set by repository
      name: name.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return new Role(roleProps);
  }

  public static fromPersistence(props: RoleProps): Role {
    return new Role(props);
  }

  public activate(): void {
    this.props.isActive = true;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public changeName(newName: string): void {
    if (!newName.trim()) {
      throw new Error('Role name cannot be empty');
    }
    this.props.name = newName.trim();
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  public toPersistence(): Record<string, any> {
    return {
      id: this.props.id,
      name: this.props.name,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
