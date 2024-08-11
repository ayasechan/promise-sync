import { Mutex } from "./sync.js";

export const channelClosedError = new Error("channel closed");

export class Channel<T> {
  #lock = new Mutex();
  #q: T[] = [];
  #pushq: CallableFunction[] = [];
  #takeq: CallableFunction[] = [];
  #closed: boolean = false;
  constructor(readonly cap: number, readonly defaultv: T) {}
  async push(v: T) {
    if (this.#closed) {
      throw channelClosedError;
    }
    await this.#lock.lock();
    try {
      if (this.#takeq.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.#takeq.shift()!(v);
        return;
      }

      if (this.#q.length < this.cap) {
        this.#q.push(v);
        return;
      }

      return new Promise<void>((res) => {
        this.#pushq.push(() => {
          this.#q.push(v);
          res();
        });
      });
    } finally {
      this.#lock.unlock();
    }
  }

  async take(): Promise<T> {
    await this.#lock.lock();
    try {
      this.#pushq.shift()?.();

      if (this.#q.length) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.#q.shift()!;
      }
      if (this.#closed) {
        return this.defaultv;
      }
      return new Promise((res) => {
        this.#takeq.push(res);
      });
    } finally {
      this.#lock.unlock();
    }
  }
  close() {
    this.#closed = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    this.#pushq.map((v) => v());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    this.#takeq.map((v) => v(this.defaultv));
  }
}

export class WaitGroup {
  #tasks: VoidFunction[] = [];
  #ps: Promise<void>[] = [];
  add(n: number) {
    for (let i = 0; i < n; i++) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.#ps.push(new Promise<void>((ok) => this.#tasks.push(ok)));
    }
  }
  done() {
    this.#tasks.pop()?.();
  }
  async wait() {
    await Promise.all(this.#ps);
    this.#ps = [];
  }
}
