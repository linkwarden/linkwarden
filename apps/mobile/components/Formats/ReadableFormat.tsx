import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Linking, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import NetInfo from "@react-native-community/netinfo";
import useAuthStore from "@/store/auth";
import WebView from "react-native-webview";
import { SheetManager } from "react-native-actions-sheet";
import { decode } from "html-entities";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { ArchivedFormat } from "@linkwarden/types/global";
import { Highlight, Link as LinkType } from "@linkwarden/prisma/client";
import {
  readerViewCSS,
  readerViewThemeVars,
} from "@linkwarden/lib/readerViewStyles";
import {
  HIGHLIGHT_COLORS,
  HighlightColor,
  MAX_HIGHLIGHT_TEXT_LENGTH,
  ReadableHighlightDraft,
} from "@/components/ActionSheets/ReadableHighlightSheet";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

type SelectionInfo = {
  linkId: number;
  text: string;
  startOffset: number;
  endOffset: number;
};
const HIGHLIGHT_MENU_KEY = "highlight";
const COPY_MENU_KEY = "copy";
const SEARCH_WEB_MENU_KEY = "search-web";

function normalizeHighlightColor(color?: string | null): HighlightColor {
  if (color === "red" || color === "blue" || color === "green") return color;
  return "yellow";
}

function normalizeSelectedText(text?: string | null) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function escapeForInlineScript(value: string) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeForInjectedScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function isSelectionInfo(value: unknown): value is SelectionInfo {
  if (!value || typeof value !== "object") return false;

  const candidate = value as SelectionInfo;

  return (
    typeof candidate.linkId === "number" &&
    typeof candidate.text === "string" &&
    typeof candidate.startOffset === "number" &&
    typeof candidate.endOffset === "number"
  );
}

function isHighlight(value: unknown): value is Highlight {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Highlight;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.linkId === "number" &&
    typeof candidate.text === "string" &&
    typeof candidate.startOffset === "number" &&
    typeof candidate.endOffset === "number" &&
    typeof candidate.color === "string"
  );
}

function findMatchingHighlight(
  highlights: Highlight[],
  selection: SelectionInfo
) {
  return highlights.find(
    (highlight) =>
      highlight.startOffset === selection.startOffset &&
      highlight.endOffset === selection.endOffset
  );
}

function ReadableSkeleton({ theme }: { theme: (typeof rawTheme)["light"] }) {
  const barStyle = {
    backgroundColor: theme["neutral-content"],
    borderRadius: 6,
    height: 14,
    marginBottom: 10,
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View
        style={{ ...barStyle, height: 22, width: "75%", marginBottom: 14 }}
      />
      <View style={{ ...barStyle, width: "50%", height: 12 }} />
      <View
        style={{ ...barStyle, width: "40%", height: 12, marginBottom: 20 }}
      />
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme["neutral-content"],
          marginBottom: 20,
        }}
      />
      <View style={{ ...barStyle, width: "100%" }} />
      <View style={{ ...barStyle, width: "100%" }} />
      <View style={{ ...barStyle, width: "85%" }} />
      <View style={{ ...barStyle, width: "92%" }} />
      <View style={{ ...barStyle, width: "70%" }} />
      <View style={{ ...barStyle, width: "95%" }} />
      <View style={{ ...barStyle, width: "100%" }} />
      <View style={{ ...barStyle, width: "80%" }} />
    </View>
  );
}

export default function ReadableFormat({
  link,
  setIsLoading,
}: Props) {
  const FORMAT = ArchivedFormat.readability;

  const { auth } = useAuthStore();
  const [content, setContent] = useState<string>("");
  const { colorScheme } = useColorScheme();
  const webViewRef = useRef<any>(null);
  const latestSelectionRef = useRef<SelectionInfo | null>(null);
  const pendingSelectionTextRef = useRef<string | null>(null);
  const isWebViewReadyRef = useRef(false);

  useEffect(() => {
    async function loadCacheOrFetch() {
      const filePath =
        FileSystem.documentDirectory +
        `archivedData/readable/link_${link.id}.html`;

      await FileSystem.makeDirectoryAsync(
        filePath.substring(0, filePath.lastIndexOf("/")),
        {
          intermediates: true,
        }
      ).catch(() => {});

      const [info] = await Promise.all([FileSystem.getInfoAsync(filePath)]);

      if (info.exists) {
        const rawContent = await FileSystem.readAsStringAsync(filePath);
        setContent(rawContent);
      }

      const net = await NetInfo.fetch();

      if (net.isConnected) {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

        try {
          const response = await fetch(apiUrl, {
            headers: { Authorization: `Bearer ${auth.session}` },
          });

          const data = (await response.json()).content;
          setContent(data);
          await FileSystem.writeAsStringAsync(filePath, data, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch (e) {
          console.error("Failed to fetch content", e);
        }
      }
    }

    loadCacheOrFetch();
  }, [FORMAT, auth.instance, auth.session, link.id]);

  const theme = rawTheme[colorScheme as ThemeName];
  const isDark = colorScheme === "dark";

  const title = decode(link.name || link.description || link.url || "");
  const dateStr = new Date(
    link?.importDate || link.createdAt
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const { data: linkHighlights = [] } = useQuery({
    queryKey: ["highlights", link.id],
    queryFn: async () => {
      const response = await fetch(
        `${auth.instance}/api/v1/links/${link.id}/highlights`,
        {
          headers: {
            Authorization: `Bearer ${auth.session}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch highlights.");

      const data = await response.json();

      return data.response as Highlight[];
    },
    enabled: Boolean(
      link.id &&
        auth.instance &&
        auth.session &&
        auth.status === "authenticated"
    ),
    initialData: [] as Highlight[],
  });

  const clearWebSelection = useCallback(() => {
    pendingSelectionTextRef.current = null;

    webViewRef.current?.injectJavaScript(`
      if (window.__READABLE_VIEW__?.clearSelection) {
        window.__READABLE_VIEW__.clearSelection();
      }
      true;
    `);
  }, []);

  const showHighlightSheet = useCallback(
    async (draft: ReadableHighlightDraft) => {
      try {
        await SheetManager.show("readable-highlight-sheet", {
          payload: {
            draft,
          },
        });
      } finally {
        clearWebSelection();
      }
    },
    [clearWebSelection]
  );

  const openDraftFromSelection = useCallback(
    (selection: SelectionInfo) => {
      if (!selection.text.trim()) {
        clearWebSelection();
        return;
      }

      if (selection.text.length > MAX_HIGHLIGHT_TEXT_LENGTH) {
        Alert.alert(
          "Selection too long",
          "Please select a shorter passage before creating a highlight."
        );
        clearWebSelection();
        return;
      }

      const existingHighlight = findMatchingHighlight(
        linkHighlights,
        selection
      );
      pendingSelectionTextRef.current = null;

      void showHighlightSheet({
        highlightId: existingHighlight?.id ?? null,
        linkId: selection.linkId,
        text: selection.text,
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        color: normalizeHighlightColor(existingHighlight?.color),
        comment: existingHighlight?.comment ?? "",
      });
    },
    [clearWebSelection, linkHighlights, showHighlightSheet]
  );

  const openDraftFromHighlight = useCallback(
    (highlight: Highlight) => {
      pendingSelectionTextRef.current = null;

      void showHighlightSheet({
        highlightId: highlight.id,
        linkId: highlight.linkId,
        text: highlight.text,
        startOffset: highlight.startOffset,
        endOffset: highlight.endOffset,
        color: normalizeHighlightColor(highlight.color),
        comment: highlight.comment ?? "",
      });
    },
    [showHighlightSheet]
  );

  const requestLatestSelection = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function () {
        const selection =
          window.__READABLE_VIEW__?.getSelectionInfo?.() ?? null;

        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "selection",
            payload: selection,
          })
        );
      })();
      true;
    `);
  }, []);

  const syncHighlightsToWebView = useCallback((highlights: Highlight[]) => {
    if (!isWebViewReadyRef.current) return;

    webViewRef.current?.injectJavaScript(`
      if (window.__READABLE_VIEW__?.renderHighlights) {
        window.__READABLE_VIEW__.renderHighlights(${escapeForInjectedScript(
          highlights
        )});
      }
      true;
    `);
  }, []);

  useEffect(() => {
    syncHighlightsToWebView(linkHighlights);
  }, [linkHighlights, syncHighlightsToWebView]);

  useEffect(() => {
    isWebViewReadyRef.current = false;
  }, [content, colorScheme]);

  useEffect(() => {
    latestSelectionRef.current = null;
    pendingSelectionTextRef.current = null;
    clearWebSelection();
    void SheetManager.hide("readable-highlight-sheet");
  }, [clearWebSelection, link.id]);

  const htmlDocument = useMemo(
    () => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <style>
        :root { ${readerViewThemeVars(theme, isDark)} }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 16px;
          background-color: ${theme["base-100"]};
          color: ${theme["base-content"]};
          font-family: -apple-system, system-ui, sans-serif;
          -webkit-text-size-adjust: 100%;
        }
        a { color: ${theme.primary}; }
        img { max-width: 100%; height: auto; }
        .rv-header-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          line-height: 1.3;
          overflow-wrap: anywhere;
          word-break: normal;
          hyphens: manual;
        }
        .rv-header-meta {
          font-size: 16px;
          color: ${theme.neutral};
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }
        .rv-header-meta a {
          color: ${theme.neutral};
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .rv-header-separator {
          border: none;
          border-top: 1px solid ${theme["neutral-content"]};
          margin: 10px 0 20px 0;
        }
        .rv-highlight {
          border-radius: 5px;
          padding-left: 0.25rem;
          padding-right: 0.25rem;
        }
        .rv-highlight--commented {
          border-bottom-style: solid;
          border-bottom-width: 2px;
        }
        .rv-highlight--yellow {
          background-color: ${HIGHLIGHT_COLORS[0].backgroundColor};
          border-bottom-color: ${HIGHLIGHT_COLORS[0].borderColor};
        }
        .rv-highlight--red {
          background-color: ${HIGHLIGHT_COLORS[1].backgroundColor};
          border-bottom-color: ${HIGHLIGHT_COLORS[1].borderColor};
        }
        .rv-highlight--blue {
          background-color: ${HIGHLIGHT_COLORS[2].backgroundColor};
          border-bottom-color: ${HIGHLIGHT_COLORS[2].borderColor};
        }
        .rv-highlight--green {
          background-color: ${HIGHLIGHT_COLORS[3].backgroundColor};
          border-bottom-color: ${HIGHLIGHT_COLORS[3].borderColor};
        }
        ${readerViewCSS}
      </style>
    </head>
    <body>
      <div class="rv-header-title">${title
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</div>
      <div class="rv-header-meta">
        <a href="${(link.url || "").replace(/"/g, "&quot;")}">${
          link.url || ""
        }</a>
      </div>
      <div class="rv-header-meta">${dateStr}</div>
      <hr class="rv-header-separator" />
      <div id="readable-view" class="reader-view read-only"></div>
      <script>
        (function () {
          const initialContent = ${escapeForInlineScript(content)};

          const state = {
            currentSelection: null,
            lastValidSelection: null,
            highlightsById: {},
          };

          function postMessage(type, payload) {
            window.ReactNativeWebView?.postMessage(
              JSON.stringify({ type: type, payload: payload })
            );
          }

          function getContainer() {
            return document.getElementById("readable-view");
          }

          function setContent() {
            const container = getContainer();
            if (!container) return;

            // Injecting via innerHTML keeps archived scripts inert while still
            // preserving the article markup we need to render.
            container.innerHTML = initialContent;
          }

          function clearSelection() {
            window.getSelection?.()?.removeAllRanges();
            state.currentSelection = null;
            state.lastValidSelection = null;
          }

          function getSelectionInfo() {
            return state.currentSelection || state.lastValidSelection;
          }

          function serializeSelection(shouldNotify) {
            const selection = window.getSelection?.();
            const container = getContainer();

            if (
              !selection ||
              selection.isCollapsed ||
              !container ||
              selection.rangeCount === 0
            ) {
              state.currentSelection = null;
              if (shouldNotify) postMessage("selection", null);
              return null;
            }

            const range = selection.getRangeAt(0);

            if (!container.contains(range.commonAncestorContainer)) {
              state.currentSelection = null;
              if (shouldNotify) postMessage("selection", null);
              return null;
            }

            let startOffset = -1;
            let endOffset = -1;
            let currentOffset = 0;

            const treeWalker = document.createTreeWalker(
              container,
              NodeFilter.SHOW_TEXT
            );

            while (treeWalker.nextNode()) {
              const node = treeWalker.currentNode;
              const nodeLength = node.textContent?.length ?? 0;

              if (node === range.startContainer) {
                startOffset = currentOffset + range.startOffset;
              }

              if (node === range.endContainer) {
                endOffset = currentOffset + range.endOffset;
                break;
              }

              currentOffset += nodeLength;
            }

            if (startOffset === -1 || endOffset === -1) {
              state.currentSelection = null;
              if (shouldNotify) postMessage("selection", null);
              return null;
            }

            const info = {
              linkId: ${link.id},
              text: range.toString(),
              startOffset: startOffset,
              endOffset: endOffset,
            };

            if (!info.text.trim()) {
              state.currentSelection = null;
              if (shouldNotify) postMessage("selection", null);
              return null;
            }

            state.currentSelection = info;
            state.lastValidSelection = info;

            if (shouldNotify) {
              postMessage("selection", info);
            }

            return info;
          }

          function unwrapHighlights() {
            const container = getContainer();
            if (!container) return;

            const wrappers = Array.from(
              container.querySelectorAll('span[data-rv-highlight="true"]')
            );

            wrappers.forEach((wrapper) => {
              const parent = wrapper.parentNode;
              if (!parent) return;

              while (wrapper.firstChild) {
                parent.insertBefore(wrapper.firstChild, wrapper);
              }

              parent.removeChild(wrapper);
              parent.normalize();
            });
          }

          function applyHighlight(highlight) {
            const container = getContainer();
            if (!container) return;

            let currentOffset = 0;
            const treeWalker = document.createTreeWalker(
              container,
              NodeFilter.SHOW_TEXT
            );

            const rangesToWrap = [];

            while (treeWalker.nextNode()) {
              const node = treeWalker.currentNode;
              const nodeLength = node.textContent?.length ?? 0;
              const nodeStart = currentOffset;
              const nodeEnd = nodeStart + nodeLength;

              if (
                nodeStart < highlight.endOffset &&
                nodeEnd > highlight.startOffset
              ) {
                rangesToWrap.push({
                  node: node,
                  start: Math.max(0, highlight.startOffset - nodeStart),
                  end: Math.min(nodeLength, highlight.endOffset - nodeStart),
                });
              }

              currentOffset += nodeLength;
            }

            rangesToWrap.forEach((rangeToWrap) => {
              let textNode = rangeToWrap.node;
              let start = rangeToWrap.start;
              let end = rangeToWrap.end;

              if (!(textNode instanceof Text)) return;

              if (start > 0) {
                textNode.splitText(start);
                textNode = textNode.nextSibling;
                end -= start;
              }

              if (!(textNode instanceof Text)) return;

              if (end < textNode.length) {
                textNode.splitText(end);
              }

              const wrapper = document.createElement("span");

              wrapper.setAttribute("data-rv-highlight", "true");
              wrapper.setAttribute("data-highlight-id", String(highlight.id));
              wrapper.classList.add(
                "rv-highlight",
                "rv-highlight--" + highlight.color
              );

              if (highlight.comment) {
                wrapper.classList.add("rv-highlight--commented");
              }

              textNode.parentNode?.insertBefore(wrapper, textNode);
              wrapper.appendChild(textNode);
            });
          }

          function renderHighlights(highlights) {
            state.highlightsById = {};

            unwrapHighlights();

            if (!Array.isArray(highlights) || highlights.length === 0) {
              return;
            }

            const sortedHighlights = highlights
              .slice()
              .sort((a, b) => a.startOffset - b.startOffset);

            sortedHighlights.forEach((highlight) => {
              state.highlightsById[highlight.id] = highlight;
              applyHighlight(highlight);
            });
          }

          document.addEventListener("selectionchange", function () {
            serializeSelection(true);
          });

          document.addEventListener("mouseup", function () {
            serializeSelection(true);
          });

          document.addEventListener(
            "touchend",
            function () {
              window.setTimeout(function () {
                serializeSelection(true);
              }, 0);
            },
            { passive: true }
          );

          document.addEventListener("click", function (event) {
            const target = event.target;

            if (!(target instanceof Element)) return;

            const highlightEl = target.closest('span[data-rv-highlight="true"]');
            if (!highlightEl) return;

            const highlightId = Number(
              highlightEl.getAttribute("data-highlight-id")
            );
            const highlight = state.highlightsById[highlightId];

            if (!highlight) return;

            event.preventDefault();
            event.stopPropagation();
            clearSelection();
            postMessage("highlight-press", highlight);
          });

          window.__READABLE_VIEW__ = {
            clearSelection: clearSelection,
            getSelectionInfo: getSelectionInfo,
            renderHighlights: renderHighlights,
          };

          setContent();
          postMessage("ready", null);
        })();
      </script>
    </body>
    </html>
  `,
    [content, dateStr, isDark, link.id, link.url, theme, title]
  );

  if (!content) {
    return <ReadableSkeleton theme={theme} />;
  }

  const handleCustomMenuSelection = (event: {
    nativeEvent: {
      key: string;
      selectedText: string;
    };
  }) => {
    const selectedText = event.nativeEvent.selectedText || "";

    if (event.nativeEvent.key === COPY_MENU_KEY) {
      if (selectedText) {
        void Clipboard.setStringAsync(selectedText);
      }
      clearWebSelection();
      return;
    }

    if (event.nativeEvent.key === SEARCH_WEB_MENU_KEY) {
      const normalizedText = normalizeSelectedText(selectedText);

      if (normalizedText) {
        void Linking.openURL(
          `https://www.google.com/search?q=${encodeURIComponent(
            normalizedText
          )}`
        );
      }

      clearWebSelection();
      return;
    }

    if (event.nativeEvent.key !== HIGHLIGHT_MENU_KEY) return;

    const normalizedText = normalizeSelectedText(selectedText);
    if (!normalizedText) return;

    const selection = latestSelectionRef.current;

    if (selection && normalizeSelectedText(selection.text) === normalizedText) {
      openDraftFromSelection(selection);
      return;
    }

    pendingSelectionTextRef.current = normalizedText;
    requestLatestSelection();
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    let message:
      | {
          type?: string;
          payload?: unknown;
        }
      | undefined;

    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }

    if (message?.type === "ready") {
      isWebViewReadyRef.current = true;
      syncHighlightsToWebView(linkHighlights);
      return;
    }

    if (message?.type === "selection") {
      if (!isSelectionInfo(message.payload)) {
        latestSelectionRef.current = null;
        pendingSelectionTextRef.current = null;
        return;
      }

      latestSelectionRef.current = message.payload;

      if (
        pendingSelectionTextRef.current &&
        normalizeSelectedText(message.payload.text) ===
          pendingSelectionTextRef.current
      ) {
        pendingSelectionTextRef.current = null;
        openDraftFromSelection(message.payload);
        return;
      }

      pendingSelectionTextRef.current = null;
      return;
    }

    if (message?.type === "highlight-press" && isHighlight(message.payload)) {
      openDraftFromHighlight(message.payload);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ html: htmlDocument }}
      style={{
        flex: 1,
        backgroundColor: "transparent",
      }}
      onLoadEnd={() => setIsLoading(false)}
      onMessage={handleWebViewMessage}
      onCustomMenuSelection={handleCustomMenuSelection}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === "about:blank" || request.url.startsWith("data:")) {
          return true;
        }
        Linking.openURL(request.url);
        return false;
      }}
      javaScriptEnabled
      menuItems={[
        { label: "Highlight", key: HIGHLIGHT_MENU_KEY },
        { label: "Copy", key: COPY_MENU_KEY },
        { label: "Search Web", key: SEARCH_WEB_MENU_KEY },
      ]}
      originWhitelist={["*"]}
    />
  );
}
