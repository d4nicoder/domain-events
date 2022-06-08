export type MessagePrimitives = {
  id: string;
  route: string;
  correlationId?: string;
  occurredAt: Date;
  payload: unknown;
  replyTo?: string;
};

export class Message {
  public readonly route: string;
  public readonly payload: unknown;
  public readonly id: string;
  public readonly correlationId?: string;
  public readonly occurredAt: Date;
  public readonly replyTo?: string;

  constructor(
    props: {
      route: string;
      payload: unknown;
      correlationId?: string;
      replyTo?: string;
    },
  ) {
    this.route = props.route;
    this.payload = props.payload;
    this.id = crypto.randomUUID();
    this.correlationId = props.correlationId;
    this.occurredAt = new Date();
    this.replyTo = props.replyTo;
    this.ensureIsValid();
  }

  private ensureIsValid(): void {
    if (typeof this.route !== "string" || !this.route.length) {
      throw new Error("Route should be a string with length");
    }
  }

  toPrimitives(): MessagePrimitives {
    return {
      route: this.route,
      id: this.id,
      occurredAt: this.occurredAt,
      correlationId: this.correlationId,
      replyTo: this.replyTo,
      payload: this.payload,
    };
  }
}
