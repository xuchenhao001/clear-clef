export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  shouldStop: () => boolean = () => false,
): Promise<void> {
  let index = 0;

  async function run() {
    while (true) {
      if (shouldStop()) return;
      const current = index;
      index += 1;
      if (current >= items.length) return;
      await worker(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(1, limit), items.length) },
    () => run(),
  );
  await Promise.all(workers);
}
