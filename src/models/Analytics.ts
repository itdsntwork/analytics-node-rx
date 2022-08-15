import { AxiosInstance, AxiosRequestConfig } from "axios";
import { Subject } from "rxjs";
import { Message, MessageParams, Type } from "./Message";
import { Queue } from "./Queue";
import { Payload, Service } from "./Service";

const version = require("./package.json").version;

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
      version,
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

  identify(message: MessageParams, callback: Callback) {
    this.dispatchMessage(message, callback, "identify");
  }
  group(message: MessageParams, callback: Callback) {
    this.dispatchMessage(message, callback, "group");
  }
  track(message: MessageParams, callback: Callback) {
    this.dispatchMessage(message, callback, "track");
  }
  page(message: MessageParams, callback: Callback) {
    this.dispatchMessage(message, callback, "page");
  }
  screen(message: MessageParams, callback: Callback) {
    this.dispatchMessage(message, callback, "screen");
  }
  alias(message: MessageParams, callback: Callback) {
    this.dispatchMessage(message, callback, "alias");
  }
  flush() {}

  private async dispatchMessage(
    message: MessageParams,
    callback: Callback,
    type: Type
  ) {
    try {
      await Message.validateParams(message, type);
      const _message = new Message(message, type, version);
      this.eventSubject.next({ message: _message, callback });
    } catch (error) {
      callback(error, message);
    }
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

export interface Event {
  message: Message;
  callback: Callback;
}
export type Callback = (error: any, data: any) => void;
