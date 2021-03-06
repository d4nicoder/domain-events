import { Subscriber } from "./Subscriber.ts";
import { Message } from "./Message.ts";

export class Exchange {
  private readonly mode: string;
  private messages: Message[];
  private queues: Subscriber[];

  constructor(mode?: "direct" | "topic" | "fanout") {
    this.mode = mode || "direct";
    this.messages = [];
    this.queues = [];
    this.ensureIsValid();
  }

  private ensureIsValid() {
    if (!/^(direct|topic|fanout)$/.test(this.mode)) {
      throw new Error("InvalidExchangeMode");
    }
  }

  async publish(message: Message): Promise<void> {
    this.messages.push(message);
    return await this.processMessages();
  }

  /**
   * Bind queue to a route
   * @param {Subscriber} listener
   */
  bindQueue(listener: Subscriber) {
    const existingQueue = this.queues.find((subscriber) =>
      subscriber.queue === listener.queue
    );
    if (existingQueue) {
      throw new Error("QueueAlreadyExistsError");
    }
    this.queues.push(listener);
  }

  /**
   * Unbind a queue
   * @param {string} queue
   */
  unbindQueue(queue: string) {
    this.queues = this.queues.filter((subscriber) =>
      subscriber.queue !== queue
    );
  }

  private isMatchingRoute(
    messageRoute: string,
    subscriberRoute: string,
  ): boolean {
    if (this.mode === "fanout") {
      return true;
    } else if (this.mode === "direct") {
      return messageRoute === subscriberRoute;
    } else {
      // Topic mode
      const expStr = subscriberRoute.replace(".", "\.").replace("*", "[^\.]*");
      const regExp = new RegExp(`^${expStr}$`);
      return regExp.test(messageRoute);
    }
  }

  private async processMessages(): Promise<void> {
    const processedMessages: string[] = [];
    for (let m = 0; m < this.messages.length; m++) {
      const message = this.messages[m];
      for (let l = 0; l < this.queues.length; l++) {
        const listener = this.queues[l];

        if (this.isMatchingRoute(message.route, listener.routingKey)) {
          try {
            await listener.handler(message.toPrimitives());
          } catch (e: unknown) {
            console.error(e);
          }
        }
      }
      processedMessages.push(message.id);
    }

    this.messages = this.messages.filter((m) =>
      processedMessages.indexOf(m.id) < 0
    );
  }
}
