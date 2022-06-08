import { assert, assertEquals } from "../deps.ts";
import sinon from "https://cdn.skypack.dev/sinon@14.0.0?dts";
import { Subscriber } from "../lib/Subscriber.ts";
import { Message } from "../lib/Message.ts";
import { Exchange } from "../lib/Exchange.ts";

Deno.test("Exchange", async (t) => {
  await t.step("should instantiate correctly", () => {
    const store = new Exchange();
    assert(store instanceof Exchange);
  });

  await t.step(
    "should print error if listener handler throws an exception",
    async () => {
      const store = new Exchange("direct");
      const route = "route";
      const payload = "payload";
      const handler = () => {
        throw new Error("custom error");
      };
      const spy = sinon.spy(console, "error");
      const listener = new Subscriber({
        routingKey: route,
        handler,
      });
      store.subscribe(listener);
      const message = new Message({
        route,
        payload,
      });
      await store.publish(message);
      assertEquals(spy.callCount, 1);
    },
  );

  await t.step("in direct mode", async (t) => {
    await t.step("should publish message only to exact routes", async () => {
      const store = new Exchange("direct");
      const handler = async () => {};
      const handlerSpy = sinon.spy(handler);
      const listener = new Subscriber({
        handler: handlerSpy,
        routingKey: "test",
      });
      store.subscribe(listener);

      const nonMatchingListener = new Subscriber({
        handler: handlerSpy,
        routingKey: "other-route",
      });
      store.subscribe(nonMatchingListener);

      const message = new Message({
        route: "test",
        payload: "some payload",
      });
      await store.publish(message);
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
      const store = new Exchange("fanout");
      const listener1 = new Subscriber({
        handler: spyFunction,
        routingKey: "random1",
      });
      store.subscribe(listener1);
      const listener2 = new Subscriber({
        handler: spyFunction,
        routingKey: "random2",
      });
      store.subscribe(listener2);

      const message = new Message({
        payload: "payload",
        route: "any-route",
      });

      await store.publish(message);

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
        const store = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          routingKey: "start.route.path",
        });
        store.subscribe(listener);

        const message = new Message({
          route: "start.route.path.extra.content",
          payload: "payload",
        });

        await store.publish(message);
        assertEquals(handler.callCount, 0);
      },
    );

    await t.step(
      "should not deliver the message if route does not start like the message",
      async () => {
        const handler = sinon.spy();
        const store = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          routingKey: "start.route.path",
        });
        store.subscribe(listener);

        const message = new Message({
          route: "route.path",
          payload: "payload",
        });

        await store.publish(message);
        assertEquals(handler.callCount, 0);
      },
    );

    await t.step(
      "should deliver the message if route matches 100%",
      async () => {
        const handler = sinon.spy();
        const store = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          routingKey: "start.route.path",
        });
        store.subscribe(listener);

        const message = new Message({
          route: "start.route.path",
          payload: "payload",
        });

        await store.publish(message);
        assertEquals(handler.callCount, 1);
      },
    );

    await t.step(
      "should deliver the message if route matches with wildcards",
      async () => {
        const handler = sinon.spy();
        const store = new Exchange("topic");
        const listener = new Subscriber({
          handler,
          routingKey: "start.*.path",
        });
        store.subscribe(listener);

        const message = new Message({
          route: "start.route.path",
          payload: "payload",
        });

        await store.publish(message);

        const message2 = new Message({
          route: "start.other.path",
          payload: "payload",
        });

        await store.publish(message2);

        const message3 = new Message({
          route: "start.other.semi.path", // <-- This should not match
          payload: "payload",
        });

        await store.publish(message3);
        assertEquals(handler.callCount, 2);
      },
    );
  });
});
