export class Semaphore {
  #count = 0;
  #queue: (() => void)[] = [];
  #max: number;
  constructor(max: number) {
    if (max <= 0) {
      throw new Error("max arg muse be greater than 0");
    }
    this.#max = max;
  }
  require() {
    const pr =
      this.#count < this.#max
        ? Promise.resolve()
        : new Promise<void>((ok) => this.#queue.push(ok));
    this.#count += 1;
    return pr;
  }
  release() {
    this.#queue.shift()?.();
    if (this.#count > 0) {
      this.#count -= 1;
    }
  }
  count() {
    return this.#count;
  }
  max() {
    return this.#max;
  }
}

export class Lock {
  #sema = new Semaphore(1);
  async lock() {
    return this.#sema.require();
  }
  unlock() {
    this.#sema.release();
  }
}

export const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
