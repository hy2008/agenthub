/// <reference types="vitest/globals" />

import {
  computeHash,
  computeHashes,
  syncCompare,
  diffObjects,
  resolveConflict,
} from "./index";

// ========================
// computeHash
// ========================
describe("computeHash", () => {
  it("should return the same hash for the same string input", () => {
    const hash1 = computeHash("hello world");
    const hash2 = computeHash("hello world");
    expect(hash1).toBe(hash2);
  });

  it("should return different hashes for different string inputs", () => {
    const hash1 = computeHash("hello");
    const hash2 = computeHash("world");
    expect(hash1).not.toBe(hash2);
  });

  it("should return the same hash for the same object input", () => {
    const obj = { name: "test", value: 42 };
    const hash1 = computeHash(obj);
    const hash2 = computeHash(obj);
    expect(hash1).toBe(hash2);
  });

  it("should return different hashes for different object inputs", () => {
    const obj1 = { name: "test", value: 42 };
    const obj2 = { name: "test", value: 99 };
    const hash1 = computeHash(obj1);
    const hash2 = computeHash(obj2);
    expect(hash1).not.toBe(hash2);
  });

  it("should produce a 64-character hex string (SHA-256)", () => {
    const hash = computeHash("any content");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle empty string input", () => {
    const hash = computeHash("");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should handle empty object input", () => {
    const hash = computeHash({});
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should produce the same hash for objects with different key orders", () => {
    const objA = { a: 1, b: 2, c: 3 };
    const objB = { b: 2, c: 3, a: 1 };
    const hashA = computeHash(objA);
    const hashB = computeHash(objB);
    expect(hashA).toBe(hashB);
  });
});

// ========================
// computeHashes
// ========================
describe("computeHashes", () => {
  it("should return a map with correct hashes for items", () => {
    const items = [
      { id: "1", content: "hello" },
      { id: "2", content: "world" },
    ];
    const result = computeHashes(items);
    expect(result.get("1")).toBe(computeHash("hello"));
    expect(result.get("2")).toBe(computeHash("world"));
    expect(result.size).toBe(2);
  });

  it("should return an empty map for an empty array", () => {
    const result = computeHashes([]);
    expect(result.size).toBe(0);
  });

  it("should return same hash for items with identical content", () => {
    const items = [
      { id: "a", content: "same" },
      { id: "b", content: "same" },
    ];
    const result = computeHashes(items);
    expect(result.get("a")).toBe(result.get("b"));
  });

  it("should handle object content in items", () => {
    const items = [
      { id: "x", content: { foo: "bar" } },
    ];
    const result = computeHashes(items);
    expect(result.get("x")).toBe(computeHash({ foo: "bar" }));
  });
});

// ========================
// syncCompare
// ========================
describe("syncCompare", () => {
  it("should return empty diffs when both sides are empty", () => {
    const diffs = syncCompare([], []);
    expect(diffs).toEqual([]);
  });

  it("should detect new_local items (local-only)", () => {
    const local = [{ id: "1", contentHash: "abc" }];
    const remote: { id: string; contentHash: string }[] = [];
    const diffs = syncCompare(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      memoryId: "1",
      localHash: "abc",
      remoteHash: "",
      status: "new_local",
    });
  });

  it("should detect new_remote items (remote-only)", () => {
    const local: { id: string; contentHash: string }[] = [];
    const remote = [{ id: "2", contentHash: "def" }];
    const diffs = syncCompare(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      memoryId: "2",
      localHash: "",
      remoteHash: "def",
      status: "new_remote",
    });
  });

  it("should detect modified items (different hashes)", () => {
    const local = [{ id: "1", contentHash: "abc" }];
    const remote = [{ id: "1", contentHash: "xyz" }];
    const diffs = syncCompare(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      memoryId: "1",
      localHash: "abc",
      remoteHash: "xyz",
      status: "modified",
    });
  });

  it("should NOT emit diffs for unchanged items", () => {
    const local = [{ id: "1", contentHash: "abc" }];
    const remote = [{ id: "1", contentHash: "abc" }];
    const diffs = syncCompare(local, remote);
    expect(diffs).toEqual([]);
  });

  it("should handle a mixed scenario with new_local, new_remote, modified, and unchanged", () => {
    const local = [
      { id: "1", contentHash: "hash1" }, // unchanged
      { id: "2", contentHash: "hash2_new" }, // modified
      { id: "3", contentHash: "hash3" }, // new_local
    ];
    const remote = [
      { id: "1", contentHash: "hash1" }, // unchanged
      { id: "2", contentHash: "hash2_old" }, // modified
      { id: "4", contentHash: "hash4" }, // new_remote
    ];
    const diffs = syncCompare(local, remote);
    expect(diffs).toHaveLength(3);
    const findById = (id: string) => diffs.find((d) => d.memoryId === id)!;

    expect(findById("2").status).toBe("modified");
    expect(findById("3").status).toBe("new_local");
    expect(findById("4").status).toBe("new_remote");
  });

  it("should handle multiple new items on both sides", () => {
    const local = [
      { id: "a", contentHash: "ha" },
      { id: "b", contentHash: "hb" },
    ];
    const remote = [
      { id: "c", contentHash: "hc" },
      { id: "d", contentHash: "hd" },
    ];
    const diffs = syncCompare(local, remote);
    expect(diffs).toHaveLength(4);
    expect(diffs.filter((d) => d.status === "new_local")).toHaveLength(2);
    expect(diffs.filter((d) => d.status === "new_remote")).toHaveLength(2);
  });
});

// ========================
// diffObjects
// ========================
describe("diffObjects", () => {
  it("should detect added fields", () => {
    const local = { a: 1 };
    const remote = { a: 1, b: 2 };
    const diffs = diffObjects(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      field: "b",
      localValue: undefined,
      remoteValue: 2,
      type: "added",
    });
  });

  it("should detect removed fields", () => {
    const local = { a: 1, b: 2 };
    const remote = { a: 1 };
    const diffs = diffObjects(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      field: "b",
      localValue: 2,
      remoteValue: undefined,
      type: "removed",
    });
  });

  it("should detect changed fields", () => {
    const local = { a: 1, b: "old" };
    const remote = { a: 1, b: "new" };
    const diffs = diffObjects(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toMatchObject({
      field: "b",
      localValue: "old",
      remoteValue: "new",
      type: "changed",
    });
  });

  it("should return empty array when objects are identical", () => {
    const obj = { a: 1, b: "hello", c: true };
    const diffs = diffObjects(obj, obj);
    expect(diffs).toEqual([]);
  });

  it("should detect multiple changes (added, removed, changed) simultaneously", () => {
    const local = { x: 1, y: 2, z: 3 };
    const remote = { y: 99, z: 3, w: 4 };
    const diffs = diffObjects(local, remote);
    expect(diffs).toHaveLength(3);
    const findByField = (field: string) => diffs.find((d) => d.field === field)!;

    expect(findByField("x").type).toBe("removed");
    expect(findByField("y").type).toBe("changed");
    expect(findByField("w").type).toBe("added");
  });

  it("should handle nested objects compared by value", () => {
    const local = { data: { nested: true } };
    const remote = { data: { nested: false } };
    const diffs = diffObjects(local, remote);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].type).toBe("changed");
  });

  it("should treat deeply equal nested objects as unchanged", () => {
    const local = { data: { nested: { deep: [1, 2, 3] } } };
    const remote = { data: { nested: { deep: [1, 2, 3] } } };
    const diffs = diffObjects(local, remote);
    expect(diffs).toEqual([]);
  });
});

// ========================
// resolveConflict
// ========================
describe("resolveConflict", () => {
  const now = new Date();
  const earlier = new Date(now.getTime() - 60_000); // 1 minute ago

  it("local_first strategy should return local content with source 'local'", () => {
    const context = {
      localContent: { name: "local-version" },
      remoteContent: { name: "remote-version" },
      localUpdatedAt: earlier,
      remoteUpdatedAt: now,
    };
    const result = resolveConflict(context, "local_first");
    expect(result).toEqual({
      content: { name: "local-version" },
      source: "local",
    });
  });

  it("remote_first strategy should return remote content with source 'remote'", () => {
    const context = {
      localContent: { name: "local-version" },
      remoteContent: { name: "remote-version" },
      localUpdatedAt: now,
      remoteUpdatedAt: earlier,
    };
    const result = resolveConflict(context, "remote_first");
    expect(result).toEqual({
      content: { name: "remote-version" },
      source: "remote",
    });
  });

  it("newest_wins strategy should return local content when local is newer", () => {
    const context = {
      localContent: { name: "newer-local" },
      remoteContent: { name: "older-remote" },
      localUpdatedAt: now,
      remoteUpdatedAt: earlier,
    };
    const result = resolveConflict(context, "newest_wins");
    expect(result).toEqual({
      content: { name: "newer-local" },
      source: "local",
    });
  });

  it("newest_wins strategy should return remote content when remote is newer", () => {
    const context = {
      localContent: { name: "older-local" },
      remoteContent: { name: "newer-remote" },
      localUpdatedAt: earlier,
      remoteUpdatedAt: now,
    };
    const result = resolveConflict(context, "newest_wins");
    expect(result).toEqual({
      content: { name: "newer-remote" },
      source: "remote",
    });
  });

  it("newest_wins strategy should return remote when timestamps are equal", () => {
    const sameTime = new Date("2024-01-01T00:00:00Z");
    const context = {
      localContent: { value: "local" },
      remoteContent: { value: "remote" },
      localUpdatedAt: sameTime,
      remoteUpdatedAt: sameTime,
    };
    const result = resolveConflict(context, "newest_wins");
    // when equal, > returns false → falls to remote
    expect(result.source).toBe("remote");
    expect(result.content).toEqual({ value: "remote" });
  });

  it("should handle complex nested content in conflict resolution", () => {
    const context = {
      localContent: { items: [1, 2, 3], meta: { author: "alice" } },
      remoteContent: { items: [4, 5, 6], meta: { author: "bob" } },
      localUpdatedAt: new Date("2024-01-01"),
      remoteUpdatedAt: new Date("2024-01-02"),
    };
    const result = resolveConflict(context, "newest_wins");
    expect(result.source).toBe("remote");
    expect(result.content).toEqual({ items: [4, 5, 6], meta: { author: "bob" } });
  });
});
