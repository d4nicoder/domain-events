# Domain events

AMQP like domain events. This module allows you to implement domain events on
your Deno applications.

[![Deno](https://github.com/d4nicoder/domain-events/actions/workflows/deno.yml/badge.svg?branch=main)](https://github.com/d4nicoder/domain-events/actions/workflows/deno.yml)

This is a basic implementation of the most used features of an AMQP messaging
queues protocol. You will be able to declare an `Exchange` in `direct`, `topic`
or `fanout` mode. In each exchange you can declare subscribers and publish
messages to routes.

## Usage

Create an events exchange in `topic` mode, subscribe to a route and publish a
message

```typescript
import {
  Exchange,
  Message,
  MessagePrimitives,
  Subscriber,
} from "https://github.com/d4nicoder/domain-events/raw/main/mod.ts";

const exchange = new Exchange("topic");

// Creating a listener
const subscriber = new Subscriber({
  routingKey: "core.user.*", // <-- On topic exchanges you can use wildcards
  handler: async (message: MessagePrimitives) => {
    // Do awesome stuff here
  },
});

exchange.subscribe(listener);

const message = new Message({
  route: "core.user.created",
  payload: {
    id: "userId",
    name: "Tony",
    lastName: "Stark",
  },
});

await exchange.publish(message);
```
