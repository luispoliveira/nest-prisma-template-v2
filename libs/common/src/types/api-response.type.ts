export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    timestamp: string;
    correlationId?: string;
    version?: string;
  };
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class ApiResponseBuilder {
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      message: message || 'Operation completed successfully',
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static paginated<T>(
    items: T[],
    pagination: PaginatedApiResponse<T>['pagination'],
    message?: string,
  ): PaginatedApiResponse<T> {
    return {
      success: true,
      message: message || 'Data retrieved successfully',
      data: items,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  static error(message: string): Omit<ApiResponse, 'data'> {
    return {
      success: false,
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
