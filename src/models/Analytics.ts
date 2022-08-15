import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import removeTrailingSlash from "remove-trailing-slash";

class Analytics {
  private writeKey: string;
  private host: string;
  path: string;
  axiosInstance: AxiosInstance;

  constructor(writeKey: string, options?: Options) {
    this.writeKey = writeKey;
    this.host = removeTrailingSlash(options?.host || "https://api.segment.io");
    this.path = removeTrailingSlash(options?.path || "/v1/batch");
    this.axiosInstance = options?.axiosInstance
      ? options.axiosInstance
      : axios.create(options?.axiosConfig);
    
    
  }
}

interface Options {
  flushAt?: number;
  flushInterval?: number;
  host?: string;
  path?: string;
  enable: boolean;
  axiosConfig?: AxiosRequestConfig;
  axiosInstance?: AxiosInstance;
  axiosRetryConfig?: any;
  retryCount: number;
  errorHandler: (error: any) => void;
}
