import { AxiosInstance, AxiosRequestConfig } from "axios";
import { Subject } from "rxjs";
import { Queue } from "./Queue";
import { Payload, Service } from "./Service";

class Analytics {
  private service: Service;
  private queue: Queue;
  private payloadSubject = new Subject<Payload>();
  private isPendingSubject = new Subject<boolean>();
  private eventSubject = new Subject<any>();

  constructor(writeKey: string, options?: Options) {
    this.service = new Service({
      writeKey,
      client: options?.axiosInstance,
      config: options?.axiosConfig,
      host: options?.host,
      path: options?.path,
      version: "",
      retryCount: options?.retryCount,
      retryConfig: options?.retryConfig,
      errorHandler: options?.errorHandler,
      payloadSubject: this.payloadSubject,
      isPendingSubject: this.isPendingSubject,
    });
    this.queue = new Queue({
      flushAt: options?.flushAt,
      maxQueueSize: options?.maxQueueSize,
      eventSubject: this.eventSubject,
      payloadSubject: this.payloadSubject,
    });
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

export default Analytics;
