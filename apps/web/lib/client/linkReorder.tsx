import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

export type LinkReorderHandler = (
  draggedLinkId: number,
  droppedOnLinkId: number
) => void;

type Registry = {
  handler: React.MutableRefObject<LinkReorderHandler | null>;
  register: (handler: LinkReorderHandler | null) => void;
};

const LinkReorderContext = createContext<Registry | null>(null);

/**
 * Lets the page that owns a list of links hand its reorder logic to DragNDrop.
 *
 * Dropping a link onto another link and dropping it onto a collection are the same
 * gesture, so they have to share the one DndContext, which lives in MainLayout. A page
 * rendered inside it can't pass props to it, so instead it leaves a handler here and
 * DragNDrop picks it up. Kept in a ref rather than state: registering happens whenever
 * the list changes, and it shouldn't re-render the whole layout each time.
 */
export function LinkReorderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handler = useRef<LinkReorderHandler | null>(null);

  const register = useCallback((next: LinkReorderHandler | null) => {
    handler.current = next;
  }, []);

  return (
    <LinkReorderContext.Provider value={{ handler, register }}>
      {children}
    </LinkReorderContext.Provider>
  );
}

/**
 * Called by the page that owns a reorderable list. Pass null to turn reordering off,
 * which is what every page that doesn't call this does anyway.
 */
export function useRegisterLinkReorder(handler: LinkReorderHandler | null) {
  const registry = useContext(LinkReorderContext);

  useEffect(() => {
    registry?.register(handler);
    return () => registry?.register(null);
  }, [registry, handler]);
}

export function useLinkReorderHandler() {
  return useContext(LinkReorderContext)?.handler ?? null;
}
