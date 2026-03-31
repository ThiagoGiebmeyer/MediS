export interface ApiResponse<T> {
  error: boolean;
  messageError: string;
  data: T;
}
