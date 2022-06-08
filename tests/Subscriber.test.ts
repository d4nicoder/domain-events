import { assert, assertEquals, assertThrows } from "../deps.ts";
import { Subscriber } from "../lib/Subscriber.ts";

Deno.test("Subscriber", async (t) => {
  await t.step("should throw if route is not a string", () => {
    assertThrows(() => {
      new Subscriber({
        // @ts-ignore: we are checking this
        routingKey: 1234,
        handler: async () => {},
      });
    }, Error);
  });

  await t.step("should throw if handler is not a function", () => {
    assertThrows(() => {
      new Subscriber({
        routingKey: "test",
        // @ts-ignore: we are checking this
        handler: "Not a function",
      });
    }, Error);
  });

  await t.step("should be instantiated", () => {
    const subscriber = new Subscriber({
      handler: async () => {},
      routingKey: "test",
    });
    assert(subscriber instanceof Subscriber, "Listener instantiated");
  });

  await t.step("should have the correct properties", () => {
    const routingKey = "test";
    const handler = async () => {};
    const subscriber = new Subscriber({
      routingKey,
      handler,
    });
    assertEquals(subscriber.handler, handler);
    assertEquals(subscriber.routingKey, routingKey);
  });
});
