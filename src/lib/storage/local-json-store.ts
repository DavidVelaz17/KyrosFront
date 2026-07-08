const isBrowser = typeof window !== "undefined";

/** Thin wrapper around localStorage for JSON collections, with in-memory fallback during SSR. */
export class LocalJsonStore<T> {
  private memoryFallback: T[] = [];

  constructor(
    private readonly key: string,
    private readonly seed: () => T[]
  ) {}

  private read(): T[] {
    if (!isBrowser) return this.memoryFallback;

    const raw = window.localStorage.getItem(this.key);
    if (raw === null) {
      const seeded = this.seed();
      window.localStorage.setItem(this.key, JSON.stringify(seeded));
      return seeded;
    }

    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  private write(items: T[]): void {
    if (!isBrowser) {
      this.memoryFallback = items;
      return;
    }
    window.localStorage.setItem(this.key, JSON.stringify(items));
  }

  getAll(): T[] {
    return this.read();
  }

  setAll(items: T[]): void {
    this.write(items);
  }

  add(item: T): void {
    const items = this.read();
    items.push(item);
    this.write(items);
  }
}
