import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Decorator to set cache key for a method
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);

/**
 * Decorator to set cache TTL (Time To Live) for a method
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Combined decorator for cache key and TTL
 */
export const Cacheable = (key: string, ttl = 300) => {
  return (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyName, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyName, descriptor);
  };
};

export class CacheUtil {
  /**
   * Generate a cache key from parameters
   */
  static generateKey(prefix: string, ...params: (string | number)[]): string {
    const sanitizedParams = params
      .map(param => String(param))
      .map(param => param.replace(/[^a-zA-Z0-9_-]/g, '_'));

    return `${prefix}:${sanitizedParams.join(':')}`;
  }

  /**
   * Calculate cache TTL based on data type
   */
  static calculateTTL(dataType: 'static' | 'dynamic' | 'realtime'): number {
    switch (dataType) {
      case 'static':
        return 3600; // 1 hour
      case 'dynamic':
        return 300; // 5 minutes
      case 'realtime':
        return 60; // 1 minute
      default:
        return 300;
    }
  }

  /**
   * Create cache tags for organized invalidation
   */
  static createTags(entity: string, ...identifiers: string[]): string[] {
    const tags = [`entity:${entity}`];

    identifiers.forEach(id => {
      tags.push(`${entity}:${id}`);
    });

    return tags;
  }
}
