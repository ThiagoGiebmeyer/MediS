import { useState, useCallback } from "react";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { MHeaders } from "./header";

interface UseRequestResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  request: (config?: AxiosRequestConfig) => Promise<void>;
}

export function useRequest<T = any>(
  baseConfig: AxiosRequestConfig
): UseRequestResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (overrideConfig?: AxiosRequestConfig) => {
      setLoading(true);
      setError(null);
      setData(null); 

      try {
        const response: AxiosResponse<T> = await axios.request({
          ...baseConfig,
          ...overrideConfig,
          headers: {
            ...(baseConfig.headers || {}),
            ...(overrideConfig?.headers || {}),
            ...MHeaders,
          },
        });

        setData(response.data);
      } catch (err: any) {
        setError(err?.message || "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    [baseConfig]
  );
  return { data, loading, error, request };
}
