// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockAllIsIntersecting,
  setupIntersectionMocking,
  resetIntersectionMocking,
} from "react-intersection-observer/test-utils";
import { ViewMode } from "@linkwarden/types/global";

vi.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/collections/[id]" }),
}));
vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@linkwarden/router/collections", () => ({
  useCollections: () => ({ data: [] }),
}));
vi.mock("@linkwarden/router/user", () => ({
  useUser: () => ({ data: undefined }),
}));

import Links from "./Links";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const restore: (() => void)[] = [];

const stub = (target: object, key: string, descriptor: PropertyDescriptor) => {
  const original = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, ...descriptor });
  restore.push(() =>
    original
      ? Object.defineProperty(target, key, original)
      : delete (target as any)[key]
  );
};

beforeEach(() => {
  // Vitest 4 mocks of arrow functions can't be called with `new`.
  setupIntersectionMocking(((impl: (...args: any[]) => any) =>
    vi.fn(function (...args: any[]) {
      return impl(...args);
    })) as typeof vi.fn);
  // What jsdom doesn't do: lay anything out, observe sizes, match media.
  stub(HTMLElement.prototype, "offsetHeight", { get: () => 800 });
  stub(HTMLElement.prototype, "offsetWidth", { get: () => 1200 });
  stub(window, "ResizeObserver", {
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
  stub(window, "matchMedia", {
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }),
  });

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetIntersectionMocking();
  restore
    .splice(0)
    .reverse()
    .forEach((undo) => undo());
});

type Paging = {
  hasNextPage: boolean;
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
};

const render = async (
  layout: ViewMode,
  paging: Paging,
  fetchNextPage = vi.fn()
) => {
  const useData = {
    isLoading: false,
    isFetchingNextPage: false,
    fetchNextPage,
    ...paging,
  };
  await act(async () =>
    root.render(<Links layout={layout} links={[]} useData={useData} />)
  );
  return fetchNextPage;
};

const skeletons = () =>
  Array.from(container.querySelectorAll<HTMLElement>(".skeleton"));
const shimmering = () =>
  skeletons().filter((e) => !e.classList.contains("animate-none")).length;

describe.each([ViewMode.Card, ViewMode.Masonry, ViewMode.List])(
  "Links next-page placeholder (%s)",
  (layout) => {
    it("holds still while there's a next page but nothing is loading", async () => {
      await render(layout, { hasNextPage: true });

      expect(skeletons().length).toBeGreaterThan(0);
      expect(shimmering()).toBe(0);
    });

    it("shimmers while the first page loads", async () => {
      await render(layout, { hasNextPage: false, isLoading: true });

      expect(skeletons().length).toBeGreaterThan(0);
      expect(shimmering()).toBe(skeletons().length);
    });

    it("shimmers while the next page loads, then holds still again", async () => {
      await render(layout, { hasNextPage: true });
      expect(shimmering()).toBe(0);

      await render(layout, { hasNextPage: true, isFetchingNextPage: true });
      expect(shimmering()).toBe(skeletons().length);

      // A page came back and there's still another one after it.
      await render(layout, { hasNextPage: true });
      expect(shimmering()).toBe(0);
    });

    it("still asks for the next page when it scrolls into view", async () => {
      const fetchNextPage = await render(layout, { hasNextPage: true });

      act(() => mockAllIsIntersecting(true));

      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("goes away once there are no more pages", async () => {
      await render(layout, { hasNextPage: false });

      expect(skeletons()).toHaveLength(0);
    });
  }
);
