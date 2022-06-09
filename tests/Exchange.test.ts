import { assert, assertEquals, assertThrows } from "../deps.ts";
import sinon from "https://cdn.skypack.dev/sinon@14.0.0?dts";
import { Subscriber } from "../lib/Subscriber.ts";
import { Message } from "../lib/Message.ts";
import { Exchange } from "../lib/Exchange.ts";

Deno.test("Exchange", async (t) => {
  await t.step("should instantiate correctly", () => {
    const exchange = new Exchange();
    assert(exchange instanceof Exchange);
  });

  await t.step("should throw if a queue already exists", () => {
    const exchange = new Exchange();
    const queue1 = new Subscriber({
      routingKey: "test",
      queue: "queue",
      handler: async () => {},
    });
    exchange.bindQueue(queue1);

    const queue2 = new Subscriber({
      handler: async () => {},
      queue: "queue",
      routingKey: "route",
    });

    assertThrows(() => {
      exchange.bindQueue(queue2);
    }, "QueueAlreadyExists");
  });

  await t.step("should unbind a queue", async () => {
    const exchange = new Exchange();
    const handler = sinon.spy();
    const queue = new Subscriber({
      queue: "queue.to.unbind",
      routingKey: "routing.key",
      handler,
    });

    exchange.bindQueue(queue);

    const message = new Message({
      route: "routing.key",
      payload: "payload",
    });

    await exchange.publish(message);

    exchange.unbindQueue(queue.queue);

    await exchange.publish(message);

    // Should only be called once
    assertEquals(handler.callCount, 1);
  });

  await t.step(
    "should print error if listener handler throws an exception",
    async () => {
      const exchange = new Exchange("direct");
      const route = "route";
      const payload = "payload";
      const queue = "queue";
      const handler = () => {
        throw new Error("custom error");
      };
      const spy = sinon.stub(console, "error").returns();
      const subscriber = new Subscriber({
        routingKey: route,
        handler,
        queue,
      });
      exchange.bindQueue(subscriber);
      const message = new Message({
        route,
        payload,
      });
      await exchange.publish(message);
      assertEquals(spy.callCount, 1);
    },
  );

  await t.step("in direct mode", async (t) => {
    await t.step("should publish message only to exact routes", async () => {
      const exchange = new Exchange("direct");
      const handler = async () => {};
      const handlerSpy = sinon.spy(handler);
      const listener = new Subscriber({
        handler: handlerSpy,
        queue: "test",
        routingKey: "test",
      });
      exchange.bindQueue(listener);

      const nonMatchingListener = new Subscriber({
        handler: handlerSpy,
        queue: "queue",
        routingKey: "other-route",
      });
      exchange.bindQueue(nonMatchingListener);

      const message = new Message({
        route: "test",
        payload: "some payload",
      });
      await exchange.publish(message);
      assert(handlerSpy.callCount === 1);
      // @ts-ignore: sinon definition error
      assert(handlerSpy.calledWith(sinon.match({
        id: sinon.match.string,
        payload: "some payload",
        occurredAt: sinon.match.date,
        correlationId: undefined,
        replyTo: undefined,
      })));
    });
  });

  await t.step("in fanout mode", async (t) => {
    await t.step("should delivery message to everybody", async () => {
      const spyFunction = sinon.spy();
      const exchange = new Exchange("fanout");
      const listener1 = new Subscriber({
        handler: spyFunction,
        queue: "queue",
        routingKey: "random1",
      });
      exchange.bindQueue(listener1);
      const listener2 = new Subscriber({
        handler: spyFunction,
        queue: "queue2",
        routingKey: "random2",
      });
      exchange.bindQueue(listener2);

      const message = new Message({
        payload: "payload",
        route: "any-route",
      });

      await exchange.publish(message);

      assert(spyFunction.callCount === 2);
      assert(spyFunction.calledWith(sinon.match({
        payload: "payload",
      })));
    });
  });

  await t.step("in topic mode", async (t) => {
    await t.step(
      "should not deliver the message if route name only matches the begining",
      async () => {
        const handler = sinon.spy();
        const exchange = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          queue: "queue",
          routingKey: "start.route.path",
        });
        exchange.bindQueue(listener);

        const message = new Message({
          route: "start.route.path.extra.content",
          payload: "payload",
        });

        await exchange.publish(message);
        assertEquals(handler.callCount, 0);
      },
    );

    await t.step(
      "should not deliver the message if route does not start like the message",
      async () => {
        const handler = sinon.spy();
        const exchange = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          queue: "queue",
          routingKey: "start.route.path",
        });
        exchange.bindQueue(listener);

        const message = new Message({
          route: "route.path",
          payload: "payload",
        });

        await exchange.publish(message);
        assertEquals(handler.callCount, 0);
      },
    );

    await t.step(
      "should deliver the message if route matches 100%",
      async () => {
        const handler = sinon.spy();
        const exchange = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          queue: "queue",
          routingKey: "start.route.path",
        });
        exchange.bindQueue(listener);

        const message = new Message({
          route: "start.route.path",
          payload: "payload",
        });

        await exchange.publish(message);
        assertEquals(handler.callCount, 1);
      },
    );

    await t.step(
      "should deliver the message if route matches with wildcards",
      async () => {
        const handler = sinon.spy();
        const exchange = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          queue: "queue",
          routingKey: "start.*.path",
        });
        exchange.bindQueue(listener);

        const message = new Message({
          route: "start.route.path",
          payload: "payload",
        });

        await exchange.publish(message);

        const message2 = new Message({
          route: "start.other.path",
          payload: "payload",
        });

        await exchange.publish(message2);

        const message3 = new Message({
          route: "start.other.semi.path", // <-- This should not match
          payload: "payload",
        });

        await exchange.publish(message3);
        assertEquals(handler.callCount, 2);
      },
    );
  });
});
