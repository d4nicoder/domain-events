import { assert, assertEquals, assertThrows } from "../deps.ts";
import { Listener } from "../lib/Listener.ts";

Deno.test("Listener", async (t) => {
  await t.step("should throw if route is not a string", () => {
    assertThrows(() => {
      new Listener({
        // @ts-ignore: we are checking this
        routingKey: 1234,
        handler: async () => {},
      });
    }, Error);
  });

  await t.step("should throw if handler is not a function", () => {
    assertThrows(() => {
      new Listener({
        routingKey: "test",
        // @ts-ignore: we are checking this
        handler: "Not a function",
      });
    }, Error);
  });

  await t.step("should be instantiated", () => {
    const listener = new Listener({
      handler: async () => {},
      routingKey: "test",
    });
    assert(listener instanceof Listener, "Listener instantiated");
  });

  await t.step("should have the correct properties", () => {
    const routingKey = "test";
    const handler = async () => {};
    const listener = new Listener({
      routingKey,
      handler,
    });
    assertEquals(listener.handler, handler);
    assertEquals(listener.routingKey, routingKey);
  });
});
