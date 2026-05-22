import { renderHook } from "@testing-library/react";
import { useScrollAnimation, useScrollPosition } from "./use-animation";

describe("useScrollAnimation", () => {
  it("should initialize with isVisible false", () => {
    const { result } = renderHook(() => useScrollAnimation());
    expect(result.current.isVisible).toBe(false);
  });

  it("should return a ref object", () => {
    const { result } = renderHook(() => useScrollAnimation());
    expect(result.current.ref).toBeDefined();
    expect(result.current.ref.current).toBeNull();
  });

  it("should accept custom options", () => {
    const { result } = renderHook(() =>
      useScrollAnimation({ threshold: 0.5, rootMargin: "10px", triggerOnce: false })
    );
    expect(result.current.isVisible).toBe(false);
    expect(result.current.ref).toBeDefined();
  });
});

describe("useScrollPosition", () => {
  it("should initialize with scrollY 0 and scrolled false", () => {
    const { result } = renderHook(() => useScrollPosition());
    expect(result.current.scrollY).toBe(0);
    expect(result.current.scrolled).toBe(false);
  });
});