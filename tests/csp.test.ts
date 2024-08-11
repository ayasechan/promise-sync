import { beforeAll, describe, expect, test } from "vitest";

import { Channel, channelClosedError } from "../src/csp.js";
describe("channel", () => {
  test("noremal", async () => {
    const ch = new Channel(1, 0);
    await ch.push(1);
    ch.close();
    try {
      await ch.push(2);
    } catch (error) {
      expect(error).eq(channelClosedError);
    }
    expect(await ch.take()).equal(1);
    expect(await ch.take()).eq(ch.defaultv);
  });
});
