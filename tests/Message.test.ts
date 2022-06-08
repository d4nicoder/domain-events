import { assert, assertEquals, assertThrows, FakeTime, v4 } from "../deps.ts";
import { Message } from "../lib/Message.ts";

Deno.test("Message", async (t) => {
  await t.step("Should throw if route is not a string", () => {
    assertThrows(() => {
      new Message({
        // @ts-ignore: testing this
        route: 1234,
        payload: 1234,
      });
    }, Error);
  });

  await t.step("be instantiated", () => {
    const message = new Message({
      // @ts-ignore: testing this
      route: "route",
      payload: 1234,
    });

    assert(message instanceof Message);
  });

  await t.step("should have all the correct properties", () => {
    const time = new FakeTime();
    const route = "route";
    const payload = "this is a payload";
    const replyTo = "reply to";
    const correlationId = "some-id";
    const message = new Message({
      route,
      payload,
      replyTo,
      correlationId,
    });

    assert(message instanceof Message);
    assertEquals(message.route, route);
    assertEquals(message.payload, payload);
    assertEquals(message.replyTo, replyTo);
    assertEquals(message.correlationId, correlationId);
    assert(v4.validate(message.id));
    assertEquals(message.occurredAt.getTime(), time.now);
    time.restore();
  });
});
