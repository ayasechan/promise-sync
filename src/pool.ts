import { Semaphore } from "./sync.js";

type Task = () => Promise<void>;
export class PromisePool {
  #queue: Task[] = [];
  #sema: Semaphore;
  constructor(size: number) {
    this.#sema = new Semaphore(size);
  }
  submit(...tasks: Task[]) {
    for (const t of tasks) {
      this.#queue.push(async () => {
        await this.#sema.require();
        await t();
        this.#sema.release();
      });
    }
  }
  wait() {
    return Promise.all(this.#queue.map((v) => v()));
  }
}
