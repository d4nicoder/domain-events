import { MessagePrimitives } from "./Message.ts";

export class Subscriber {
  public readonly routingKey: string;
  public readonly handler: (message: MessagePrimitives) => Promise<void>;
  public readonly queue: string;

  constructor(
    props: {
      routingKey: string;
      handler: (message: MessagePrimitives) => Promise<void>;
      queue: string;
    },
  ) {
    this.routingKey = props.routingKey;
    this.handler = props.handler;
    this.queue = props.queue;
    this.ensureIsValid();
  }

  private ensureIsValid(): void {
    if (typeof this.routingKey !== "string" || !this.routingKey.length) {
      throw new Error("Routing key should be a string with length");
    }
    if (typeof this.queue !== "string" || !this.queue) {
      throw new Error("Queue should be a string with length");
    }
    if (typeof this.handler !== "function") {
      throw new Error("Handler should be a function");
    }
  }
}
