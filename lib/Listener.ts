import { MessagePrimitives } from "./Message.ts";

export class Listener {
  public readonly routingKey: string;
  public readonly handler: (message: MessagePrimitives) => Promise<void>;

  constructor(
    props: {
      routingKey: string;
      handler: (message: MessagePrimitives) => Promise<void>;
    },
  ) {
    this.routingKey = props.routingKey;
    this.handler = props.handler;
    this.ensureIsValid();
  }

  private ensureIsValid(): void {
    if (typeof this.routingKey !== "string" || !this.routingKey.length) {
      throw new Error("Routing key should be a string with length");
    }
    if (typeof this.handler !== "function") {
      throw new Error("Handler should be a function");
    }
  }
}
