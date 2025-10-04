import { AggregateRoot } from '../../shared/aggregate-root';

export interface PermissionProps {
  id: number;
  name: string;
  module: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Permission extends AggregateRoot {
  private constructor(private readonly props: PermissionProps) {
    super(props.id, props.createdAt, props.updatedAt);
  }

  public static create(name: string, module: string): Permission {
    const now = new Date();
    const permissionProps: PermissionProps = {
      id: 0, // Will be set by repository
      name: name.trim(),
      module: module.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    return new Permission(permissionProps);
  }

  public static fromPersistence(props: PermissionProps): Permission {
    return new Permission(props);
  }

  public activate(): void {
    this.props.isActive = true;
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  // Getters
  get id(): number {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get module(): string {
    return this.props.module;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  public toPersistence(): Record<string, any> {
    return {
      id: this.props.id,
      name: this.props.name,
      module: this.props.module,
      isActive: this.props.isActive,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
