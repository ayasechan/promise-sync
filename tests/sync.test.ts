import * as sync from "../src/index.js";
import { beforeAll, describe, expect, test } from "vitest";

const newTasks = (n: number) => {
  const q: (() => Promise<void>)[] = [];
  for (let i = 0; i < n; i++) {
    // eslint-disable-next-line @typescript-eslint/require-await
    q.push(async () => {
      console.log([i, Date.now()]);
    });
  }
  return q;
};

describe("sync", () => {
  test("lock", async () => {
    const locker = new sync.Lock();
    await Promise.all(
      newTasks(3).map(async (v) => {
        await locker.lock();
        await v();
        await sync.sleep(1e3);
        locker.unlock();
      }),
    );
  });

  test("semapha", async () => {
    const n = 3;
    const sema = new sync.Semaphore(n);
    await Promise.all(
      newTasks(2 * n + 1).map(async (v) => {
        await sema.require();
        await v();
        await sync.sleep(1e3);
        sema.release();
      }),
    );
  });
});

describe("pool", () => {
  test("PromisePool", async () => {
    const pool = new sync.PromisePool(3);
    pool.submit(
      ...newTasks(9).map((v) => async () => {
        await v();
        await sync.sleep(1e3);
      }),
    );
    await pool.wait();
  });
});
