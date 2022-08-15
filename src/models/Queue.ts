import { Observable } from "rxjs";

class Queue {
  private messageQueue: Message[] = [];
  private callbackQueue: (() => void)[] = [];
  private flushAt: number;
  private maxQueueSize: number;

  constructor({ messagePub, flushAt, maxQueueSize }: Props) {
    this.flushAt = Math.max(flushAt, 1) || 20;
    this.maxQueueSize = Math.max(maxQueueSize || 1024 * 450); // 500kb is the API limit, if we approach the limit i.e., 450kb, we'll flush
    messagePub.subscribe(this.onEventReceived);
  }

  private onEventReceived(event: Event) {
    const { message, callback } = event;
    this.messageQueue.push(message);
    this.callbackQueue.push(callback);
    this.flush();
  }

  private flush() {
    if (!this.shouldFlash) return;

    
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

interface Props {
  flushAt: number;
  maxQueueSize: number;
  messagePub: Observable<any>;
}

interface Event {
  message: Message;
  callback: () => void;
}

interface Message {}

export { Queue };
