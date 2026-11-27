type RawClient = {
  prepare: (query: string) => unknown;
};

type Statement = {
  bind?: (...values: unknown[]) => {
    all: () => Promise<unknown>;
    run: () => Promise<unknown>;
  };
  all?: (...values: unknown[]) => unknown;
  run?: (...values: unknown[]) => unknown;
};

function rawClient(db: unknown): RawClient {
  const client = (db as { $client?: RawClient }).$client;
  if (!client?.prepare) {
    throw new Error("Database client does not expose prepare()");
  }
  return client;
}

export async function rawAll<T>(
  db: unknown,
  query: string,
  values: unknown[] = [],
): Promise<T[]> {
  const statement = rawClient(db).prepare(query) as Statement;
  if (typeof statement.bind === "function") {
    const result = (await statement.bind(...values).all()) as
      | T[]
      | { results?: T[] };
    return Array.isArray(result) ? result : (result.results ?? []);
  }
  if (typeof statement.all !== "function") {
    throw new Error("Database statement does not support all()");
  }
  return statement.all(...values) as T[];
}

export async function rawRun(
  db: unknown,
  query: string,
  values: unknown[] = [],
): Promise<void> {
  const statement = rawClient(db).prepare(query) as Statement;
  if (typeof statement.bind === "function") {
    await statement.bind(...values).run();
    return;
  }
  if (typeof statement.run !== "function") {
    throw new Error("Database statement does not support run()");
  }
  statement.run(...values);
}
