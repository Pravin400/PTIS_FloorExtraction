export interface ReportServiceResult<T = unknown> {
  data: T;
  status: number;
}

export function reportResult<T>(data: T, options?: { status?: number }): ReportServiceResult<T> {
  return { data, status: options?.status ?? 200 };
}
