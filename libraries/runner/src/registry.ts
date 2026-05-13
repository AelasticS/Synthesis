import type { Runnable } from "./runnable";

/**
 * A small in-memory registry for Runnable transformations.
 * @synthesis/examples populates one of these at module load; @synthesis/cli
 * reads from it to list, describe, and run examples.
 */
export class RunnableRegistry {
  private readonly entries = new Map<string, Runnable>();

  public register(r: Runnable): void {
    if (this.entries.has(r.id)) {
      throw new Error(`Runnable already registered with id "${r.id}"`);
    }
    this.entries.set(r.id, r);
  }

  public list(): readonly Runnable[] {
    return [...this.entries.values()];
  }

  public get(id: string): Runnable | undefined {
    return this.entries.get(id);
  }

  public has(id: string): boolean {
    return this.entries.has(id);
  }

  public size(): number {
    return this.entries.size;
  }
}
