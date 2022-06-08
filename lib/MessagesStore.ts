import { Listener } from "./Listener.ts";
import { Message } from "./Message.ts";

export class MessagesStore {
  private readonly mode: string;
  private messages: Message[];
  private readonly listeners: Listener[];

  constructor(mode?: "direct" | "topic" | "fanout") {
    this.mode = mode || "direct";
    this.messages = [];
    this.listeners = [];
  }

  async publish(message: Message): Promise<void> {
    this.messages.push(message);
    return await this.processMessages();
  }

  addListener(listener: Listener) {
    this.listeners.push(listener);
  }

  private isMatchingRoute(
    messageRoute: string,
    listenerRoute: string,
  ): boolean {
    if (this.mode === "fanout") {
      return true;
    } else if (this.mode === "direct") {
      return messageRoute === listenerRoute;
    } else {
      // Topic mode
      const expStr = listenerRoute.replace(".", "\.").replace("*", "[^\.]*");
      const regExp = new RegExp(`^${expStr}$`);
      return regExp.test(messageRoute);
    }
  }

  private async processMessages(): Promise<void> {
    const processedMessages: string[] = [];
    for (let m = 0; m < this.messages.length; m++) {
      const message = this.messages[m];
      for (let l = 0; l < this.listeners.length; l++) {
        const listener = this.listeners[l];

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
