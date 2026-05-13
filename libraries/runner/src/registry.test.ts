import { RunnableRegistry } from "./registry";
import type { Runnable, RunResult } from "./runnable";

function makeRunnable(id: string, name: string = id, description: string = `desc-${id}`): Runnable {
  return {
    id,
    name,
    description,
    run: async (): Promise<RunResult> => ({ artifacts: [] })
  };
}

describe("RunnableRegistry", () => {
  describe("empty registry", () => {
    it("returns an empty list", () => {
      const reg = new RunnableRegistry();
      expect(reg.list()).toEqual([]);
    });

    it("reports size 0", () => {
      const reg = new RunnableRegistry();
      expect(reg.size()).toBe(0);
    });

    it("returns undefined for any get()", () => {
      const reg = new RunnableRegistry();
      expect(reg.get("x")).toBeUndefined();
    });

    it("reports has() false for any id", () => {
      const reg = new RunnableRegistry();
      expect(reg.has("x")).toBe(false);
    });
  });

  describe("with a single runnable", () => {
    it("list() returns a single-element array", () => {
      const reg = new RunnableRegistry();
      const r = makeRunnable("a");
      reg.register(r);
      expect(reg.list()).toHaveLength(1);
      expect(reg.list()[0]).toBe(r);
    });

    it("get(id) returns the runnable", () => {
      const reg = new RunnableRegistry();
      const r = makeRunnable("a");
      reg.register(r);
      expect(reg.get("a")).toBe(r);
    });

    it("has(id) returns true", () => {
      const reg = new RunnableRegistry();
      const r = makeRunnable("a");
      reg.register(r);
      expect(reg.has("a")).toBe(true);
    });

    it("size() returns 1", () => {
      const reg = new RunnableRegistry();
      reg.register(makeRunnable("a"));
      expect(reg.size()).toBe(1);
    });
  });

  describe("with multiple runnables", () => {
    it("retrieves both by id", () => {
      const reg = new RunnableRegistry();
      const a = makeRunnable("a");
      const b = makeRunnable("b");
      reg.register(a);
      reg.register(b);
      expect(reg.get("a")).toBe(a);
      expect(reg.get("b")).toBe(b);
    });

    it("preserves insertion order in list()", () => {
      const reg = new RunnableRegistry();
      const a = makeRunnable("a");
      const b = makeRunnable("b");
      const c = makeRunnable("c");
      reg.register(b);
      reg.register(a);
      reg.register(c);
      expect(reg.list().map((r) => r.id)).toEqual(["b", "a", "c"]);
    });

    it("reports correct size", () => {
      const reg = new RunnableRegistry();
      reg.register(makeRunnable("a"));
      reg.register(makeRunnable("b"));
      expect(reg.size()).toBe(2);
    });
  });

  describe("duplicate registration", () => {
    it("throws when an id is already registered", () => {
      const reg = new RunnableRegistry();
      reg.register(makeRunnable("dup"));
      expect(() => reg.register(makeRunnable("dup"))).toThrow(
        'Runnable already registered with id "dup"'
      );
    });

    it("does not replace the original entry on duplicate", () => {
      const reg = new RunnableRegistry();
      const first = makeRunnable("dup", "first");
      const second = makeRunnable("dup", "second");
      reg.register(first);
      expect(() => reg.register(second)).toThrow();
      expect(reg.get("dup")).toBe(first);
      expect(reg.size()).toBe(1);
    });
  });
});
