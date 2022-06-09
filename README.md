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
  queue: 'handle_user_changes'
});

exchange.bindQueue(listener);

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

Create an events exchange in `direct` mode, subscribe to a route and publish a
message

```typescript
import {
  Exchange,
  Message,
  MessagePrimitives,
  Subscriber,
} from "https://github.com/d4nicoder/domain-events/raw/main/mod.ts";

const exchange = new Exchange("direct");

// Creating a listener
const subscriber = new Subscriber({
  routingKey: "core.user.created", // In direct mode the route should match
  handler: async (message: MessagePrimitives) => {
    // Do awesome stuff here
  },
  queue: 'send_mail_on_user_created'
});

exchange.bindQueue(listener);

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

Create an events exchange in `fanout` mode, subscribe to a route and publish a
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
  routingKey: "no.matter", // <-- On fanout exchanges messages will be delivered to all subscribers
  handler: async (message: MessagePrimitives) => {
    // Do awesome stuff here
  },
  queue: 'some_queue_name'
});

exchange.bindQueue(listener);

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

### Unbind a queue

You can also unbind a queue at any time.

```typescript
const exchange = new Exchange('topic')

const subscriber = new Subscriber({
    routeingKey: 'some.route.key',
    queue: 'some_queue_name',
    handler: async () => {}
})

exchange.bindQueue(subscriber)

// Some logic here....

exchange.unbindQueue(subscriber.queue)

// At this moment this queue will no recive new messages
```
