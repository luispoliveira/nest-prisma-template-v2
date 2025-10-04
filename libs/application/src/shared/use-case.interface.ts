export interface UseCase<TRequest, TResponse> {
  execute(_request: TRequest): Promise<TResponse>;
}
