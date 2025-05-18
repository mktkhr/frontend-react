import apiClient from "@/apis/httpClient";

/**
 * Getのラップメソッド
 */
export const apiGet = async <T>(
  url: string,
  params?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<T> => {
  const response = await apiClient.get<T>(url, {
    params,
    headers,
  });
  return response.data;
};

/**
 * Postのラップメソッド
 */
export const apiPost = async <T, P = unknown>(
  url: string,
  data?: P,
  headers?: Record<string, string>
): Promise<T> => {
  const response = await apiClient.post<T>(url, data, {
    headers,
  });
  return response.data;
};

/**
 * Putのラップメソッド
 */
export const apiPut = async <T, P = unknown>(
  url: string,
  data?: P,
  headers?: Record<string, string>
): Promise<T> => {
  const response = await apiClient.put<T>(url, data, {
    headers,
  });
  return response.data;
};

/**
 * Deleteのラップメソッド
 */
export const apiDelete = async <T>(
  url: string,
  headers?: Record<string, string>
): Promise<T> => {
  const response = await apiClient.delete<T>(url, {
    headers,
  });
  return response.data;
};
