import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import axiosRetry, { IAxiosRetryConfig } from "axios-retry";
import removeTrailingSlash from "remove-trailing-slash";
import { Observable, Subject } from "rxjs";

class Service {
  private client: AxiosInstance;
  private host: string;
  private path: string;
  private isPendingSubject: Subject<boolean>;
  private req: any;
  private errorHandler?: (err: any) => void;

  constructor(params: Params) {
    this.client = params.client || axios.create(params.config);
    this.host = removeTrailingSlash(params.host || "https://api.segment.io");
    this.path = removeTrailingSlash(params.path || "/v1/batch");
    this.errorHandler = params.errorHandler;
    this.isPendingSubject = params.isPendingSubject;

    const retryCount = params.retryCount || 3;

    if (retryCount !== 0) {
      axiosRetry(this.client, {
        retries: retryCount,
        retryDelay: axiosRetry.exponentialDelay,
        ...params.retryConfig,
        // retryCondition is below optional config to ensure it does not get overridden
        retryCondition: this.canRetry,
      });
    }

    const headers: any = {};
    if (typeof window === "undefined") {
      headers["user-agent"] = `analytics-node/${params.version}`;
    }

    this.req = {
      auth: {
        username: params.writeKey,
      },
      headers,
    };

    params.payloadSubject.subscribe(this.submitEvents);
  }

  private canRetry(error: AxiosError) {
    // Retry Network Errors.
    if (axiosRetry.isNetworkError(error)) {
      return true;
    }

    if (!error.response) {
      // Cannot determine if the request can be retried
      return false;
    }

    // Retry Server Errors (5xx).
    if (error.response.status >= 500 && error.response.status <= 599) {
      return true;
    }

    // Retry if rate limited.
    if (error.response.status === 429) {
      return true;
    }

    return false;
  }

  submitEvents(payload: Payload) {
    const { messages, callbacks } = payload;
    if (messages.length === 0) return;

    const data = {
      batch: messages,
      timestamp: new Date(),
      sentAt: new Date(),
    };

    this.isPendingSubject.next(true);
    return this.client
      .post(`${this.host}${this.path}`, data, this.req)
      .then(() => {
        // add error handler here
        callbacks.forEach((cb) => cb(null, data));
      })
      .catch((err) => {
        callbacks.forEach((cb) => cb(err, data));
        if (typeof this.errorHandler === "function") {
          return this.errorHandler(err);
        }
        if (err.response) {
          const error = new Error(err.response.statusText);
          throw error;
        }
        throw err;
      })
      .finally(() => {
        this.isPendingSubject.next(false);
      });
  }
}

interface Params {
  client?: AxiosInstance;
  config?: AxiosRequestConfig;
  host?: string;
  path?: string;
  version: string;
  writeKey: string;
  retryCount?: number;
  retryConfig?: IAxiosRetryConfig;
  errorHandler?: (err: any) => void;
  payloadSubject: Subject<Payload>;
  isPendingSubject: Subject<boolean>;
}

export interface Payload {
  messages: any[];
  callbacks: any[];
}

export { Service };
