import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { isJwtValid } from "@/shared/utils/jwtUtil";

const TIMEOUT_IN_SEC = 10000;
const MAXIMUM_BACKOFF_IN_MS = 10000;
const MAXIMUM_RETRY_COUNT = 3;

/**
 * axiosのベース
 */
const apiClient = axios.create({
  baseURL: "/api",
  timeout: TIMEOUT_IN_SEC,
  withCredentials: true,
});

/**
 * リクエストのinterceptorの設定
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("access_token");

    // JWT が無効ならログイン画面にリダイレクト
    if (!isJwtValid(token)) {
      sessionStorage.removeItem("access_token");
      window.location.href = "/login";
      return Promise.reject(new Error("JWTが無効です"));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * レスポンスのinterceptorの設定
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const authHeader = response.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring("Bearer ".length);
      sessionStorage.setItem("access_token", token);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      _retryCount: number; // number 型として明示
    };

    // 初回リトライチェック：undefinedを許可しないため明示
    if (originalRequest._retryCount === undefined) {
      originalRequest._retryCount = 0;
    }

    if (error.response?.status === 401) {
      // 認証エラー：ログイン画面にリダイレクト
      sessionStorage.removeItem("access_token");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 自動リトライ
    if (originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount += 1;

      if (originalRequest._retryCount <= MAXIMUM_RETRY_COUNT) {
        console.warn(
          `リクエスト再試行 (${originalRequest._retryCount}) - ${originalRequest.url}`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay(originalRequest._retryCount))
        );

        return apiClient(originalRequest);
      }
    }

    if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 403:
          console.error("権限エラー：アクセスが拒否されました。", error.cause);
          break;
        case 404:
          console.error("リソースが見つかりません。", error.cause);
          break;
        case 500:
          console.error("サーバーエラー：問題が発生しました。", error.cause);
          break;
        default:
          console.error(`エラー ${status}: ${error.response.statusText}`);
      }
    } else {
      console.error("ネットワークエラー", error.cause);
    }
    return Promise.reject(error);
  }
);

/**
 * Exponential Backoff の Delay を生成する
 * @param retryCount 現在のリトライ数
 * @returns delay
 */
const retryDelay = (retryCount: number): number => {
  return Math.min(1000 * 2 ** retryCount, MAXIMUM_BACKOFF_IN_MS);
};

export default apiClient;
