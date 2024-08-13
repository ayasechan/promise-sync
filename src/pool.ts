import { Channel, WaitGroup } from "./csp.js";

export type Task = () => Promise<void>;

export class PromisePool {
  #taskCh: Channel<Task | null>;
  #wg: WaitGroup = new WaitGroup();
  constructor(readonly workerNum: number, readonly cap: number) {
    this.#taskCh = new Channel(cap, null);
    this.#wg.add(workerNum);
    for (let i = 0; i < workerNum; i++) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#process();
    }
  }
  group(): TaskGroup {
    return new TaskGroup(this);
  }
  async #process(): Promise<void> {
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
      const task = await this.#taskCh.take();
      if (!task) {
        this.#wg.done();
        return;
      }
      try {
        await task();
      } catch (error) {
        console.log(`execute task failed: ${String(error)}`);
      }
    }
  }
  async submit(...tasks: Task[]): Promise<void> {
    if (this.#taskCh.closed) {
      throw new Error(`can't put task into a closed pool`);
    }
    await Promise.all(tasks.map((v) => this.#taskCh.push(v)));
  }
  wait(): Promise<void> {
    this.#taskCh.close();
    return this.#wg.wait();
  }
}

class TaskGroup {
  #wg: WaitGroup = new WaitGroup();
  constructor(private pool: PromisePool) {
  }
  async submit(...tasks: Task[]) {
    for (const task of tasks) {
      await this.pool.submit(async () => {
        try {
          await task();
        } finally {
          this.#wg.done();
        }
      });
    }
  }
  wait() {
    return this.#wg.wait();
  }
}
