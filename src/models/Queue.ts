import { Subject } from "rxjs";
import { Event, Callback } from "./Analytics";
import { Message } from "./Message";
import { Payload } from "./Service";

class Queue {
  private messageQueue: Message[] = [];
  private callbackQueue: Callback[] = [];
  private flushAt: number;
  private maxQueueSize: number;
  private payloadSubject: Subject<Payload>;

  constructor(params: Params) {
    this.flushAt = Math.max(params?.flushAt || 20, 1);
    this.maxQueueSize = Math.max(params.maxQueueSize || 1024 * 450); // 500kb is the API limit, if we approach the limit i.e., 450kb, we'll flush
    this.payloadSubject = params.payloadSubject;
    params.eventSubject.subscribe(this.onEventReceived);
  }

  private onEventReceived(event: Event) {
    const { message, callback } = event;
    this.messageQueue.push(message);
    this.callbackQueue.push(callback);
    this.flush();
  }

  private flush() {
    if (!this.shouldFlash()) return;

    const payload: Payload = {
      messages: this.messageQueue,
      callbacks: this.callbackQueue,
    };
    this.payloadSubject.next(payload);
  }

  private shouldFlash(): boolean {
    const payload = JSON.stringify(this.messageQueue);
    if (payload.length > this.maxQueueSize) {
      return true;
    }
    if (this.messageQueue.length >= this.flushAt) {
      return true;
    }
    return false;
  }
}

interface Params {
  flushAt?: number;
  maxQueueSize?: number;
  eventSubject: Subject<any>;
  payloadSubject: Subject<Payload>;
}

export { Queue };
