import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Linking, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import useAuthStore from "@/store/auth";
import WebView from "react-native-webview";
import { SheetManager } from "react-native-actions-sheet";
import { decode } from "html-entities";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { ArchivedFormat } from "@linkwarden/types/global";
import { Highlight, Link as LinkType } from "@linkwarden/prisma/client";
import {
  READER_VIEW_DEFAULTS,
  readerViewCSS,
} from "@linkwarden/lib/readerViewStyles";
import {
  HIGHLIGHT_COLORS,
  HighlightColor,
  MAX_HIGHLIGHT_TEXT_LENGTH,
  ReadableHighlightDraft,
} from "@/components/ActionSheets/ReadableHighlightSheet";
import { useGetLinkHighlights } from "@linkwarden/router/highlights";
import useReaderStore, {
  getReadableFontFamily,
  resolveReaderTheme,
} from "@/store/reader";
import { loadCacheOrFetch } from "@/lib/cache";

type Props = {
  link: LinkType;
  setIsLoading: (state: boolean) => void;
};

export type ReadableFormatRef = {
  scrollToHighlight: (highlightId: number) => void;
};

type SelectionInfo = {
  linkId: number;
  text: string;
  startOffset: number;
  endOffset: number;
};

type SelectionContext = {
  disableHighlightMenu: boolean;
};

type ReaderStyleConfig = {
  bodyBackground: string;
  bodyColor: string;
  codeBackground: string;
  fontFamily: string;
  h1FontSize: string;
  h2FontSize: string;
  h3FontSize: string;
  h4FontSize: string;
  h5FontSize: string;
  lineHeight: string;
  linkColor: string;
  markBackground: string;
  markColor: string;
  neutralColor: string;
  neutralBorderColor: string;
  paragraphFontSize: string;
};

const HIGHLIGHT_MENU_KEY = "highlight";
const COPY_MENU_KEY = "copy";
const SEARCH_WEB_MENU_KEY = "search-web";
const DEFAULT_MENU_ITEMS = [
  { label: "Highlight", key: HIGHLIGHT_MENU_KEY },
  { label: "Copy", key: COPY_MENU_KEY },
  { label: "Search Web", key: SEARCH_WEB_MENU_KEY },
];
const NON_HIGHLIGHT_MENU_ITEMS = DEFAULT_MENU_ITEMS.filter(
  (item) => item.key !== HIGHLIGHT_MENU_KEY
);

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

function isSelectionContext(value: unknown): value is SelectionContext {
  if (!value || typeof value !== "object") return false;

  const candidate = value as SelectionContext;

  return typeof candidate.disableHighlightMenu === "boolean";
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

function getReaderStyleConfig({
  fontFamily,
  fontSize,
  lineHeight,
  theme,
  isDark,
}: {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  theme: (typeof rawTheme)["light"];
  isDark: boolean;
}): ReaderStyleConfig {
  const ratio = parseInt(fontSize, 10) / READER_VIEW_DEFAULTS.fontSize;

  return {
    bodyBackground: theme["base-100"],
    bodyColor: theme["base-content"],
    codeBackground: isDark ? "rgb(49, 49, 49)" : "rgb(230, 230, 230)",
    fontFamily,
    h1FontSize: `${READER_VIEW_DEFAULTS.h1Size * ratio}px`,
    h2FontSize: `${READER_VIEW_DEFAULTS.h2Size * ratio}px`,
    h3FontSize: `${READER_VIEW_DEFAULTS.h3Size * ratio}px`,
    h4FontSize: `${READER_VIEW_DEFAULTS.h4Size * ratio}px`,
    h5FontSize: `${READER_VIEW_DEFAULTS.h5Size * ratio}px`,
    lineHeight,
    linkColor: theme.primary,
    markBackground: `${theme.primary}80`,
    markColor: theme["base-content"],
    neutralColor: theme.neutral,
    neutralBorderColor: theme["neutral-content"],
    paragraphFontSize: fontSize,
  };
}

const ReadableFormat = forwardRef<ReadableFormatRef, Props>(function ReadableFormat(
  {
    link,
    setIsLoading,
  }: Props,
  ref
) {
  const FORMAT = ArchivedFormat.readability;

  const { auth } = useAuthStore();
  const { reader } = useReaderStore();
  const [content, setContent] = useState<string>("");
  const [disableHighlightMenu, setDisableHighlightMenu] = useState(false);
  const [webViewHtml, setWebViewHtml] = useState("");
  const { colorScheme } = useColorScheme();
  const webViewRef = useRef<any>(null);
  const latestSelectionRef = useRef<SelectionInfo | null>(null);
  const latestReaderStyleConfigRef = useRef<ReaderStyleConfig | null>(null);
  const pendingSelectionTextRef = useRef<string | null>(null);
  const pendingHighlightScrollIdRef = useRef<number | null>(null);
  const isWebViewReadyRef = useRef(false);

  useEffect(() => {
    loadCacheOrFetch({
      filePath:
        FileSystem.documentDirectory + `archivedData/readable/link_${link.id}.html`,
      setContent,
      getCachedContent: (filePath) => FileSystem.readAsStringAsync(filePath),
      fetchContent: async (filePath) => {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${FORMAT}`;

        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${auth.session}` },
        });

        const data = (await response.json()).content;

        await FileSystem.writeAsStringAsync(filePath, data, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        return data;
      },
    });
  }, [FORMAT, auth.instance, auth.session, link.id]);

  const systemTheme: ThemeName = colorScheme === "dark" ? "dark" : "light";
  const { theme, isDark } = resolveReaderTheme(
    reader.readableBackgroundColor,
    systemTheme as ThemeName
  );

  const title = decode(link.name || link.description || link.url || "");
  const dateStr = new Date(
    link?.importDate || link.createdAt
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const { data: linkHighlights = [] } = useGetLinkHighlights(link.id, auth);

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

  const scrollToHighlightInWebView = useCallback((highlightId: number) => {
    if (!isWebViewReadyRef.current) return;

    webViewRef.current?.injectJavaScript(`
      if (window.__READABLE_VIEW__?.scrollToHighlight) {
        window.__READABLE_VIEW__.scrollToHighlight(${highlightId});
      }
      true;
    `);
  }, []);

  const readerStyleConfig = useMemo(
    () =>
      getReaderStyleConfig({
        fontFamily: getReadableFontFamily(reader.readableFontFamily),
        fontSize: reader.readableFontSize,
        lineHeight: reader.readableLineHeight,
        theme,
        isDark,
      }),
    [
      isDark,
      reader.readableFontFamily,
      reader.readableFontSize,
      reader.readableLineHeight,
      theme,
    ]
  );

  const syncReaderStylesToWebView = useCallback(
    (styles: ReaderStyleConfig) => {
      if (!isWebViewReadyRef.current) return;

      webViewRef.current?.injectJavaScript(`
        if (window.__READABLE_VIEW__?.applyReaderStyles) {
          window.__READABLE_VIEW__.applyReaderStyles(
            ${escapeForInjectedScript(styles)}
          );
        }
        true;
      `);
    },
    []
  );

  useEffect(() => {
    latestReaderStyleConfigRef.current = readerStyleConfig;
  }, [readerStyleConfig]);

  const flushPendingHighlightScroll = useCallback(() => {
    if (
      !isWebViewReadyRef.current ||
      pendingHighlightScrollIdRef.current === null
    ) {
      return;
    }

    scrollToHighlightInWebView(pendingHighlightScrollIdRef.current);
    pendingHighlightScrollIdRef.current = null;
  }, [scrollToHighlightInWebView]);

  useImperativeHandle(
    ref,
    () => ({
      scrollToHighlight: (highlightId: number) => {
        pendingHighlightScrollIdRef.current = highlightId;
        flushPendingHighlightScroll();
      },
    }),
    [flushPendingHighlightScroll]
  );

  useEffect(() => {
    syncHighlightsToWebView(linkHighlights);
  }, [linkHighlights, syncHighlightsToWebView]);

  useEffect(() => {
    syncReaderStylesToWebView(readerStyleConfig);
  }, [readerStyleConfig, syncReaderStylesToWebView]);

  useEffect(() => {
    const currentReaderStyleConfig =
      latestReaderStyleConfigRef.current ?? readerStyleConfig;
    const initialStyles = escapeForInlineScript(
      JSON.stringify(currentReaderStyleConfig)
    );

    setWebViewHtml(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
      <style>
        :root {
          --rv-body-bg: ${currentReaderStyleConfig.bodyBackground};
          --rv-body-color: ${currentReaderStyleConfig.bodyColor};
          --rv-code-bg: ${currentReaderStyleConfig.codeBackground};
          --rv-font-family: ${currentReaderStyleConfig.fontFamily};
          --rv-h1-font-size: ${currentReaderStyleConfig.h1FontSize};
          --rv-h2-font-size: ${currentReaderStyleConfig.h2FontSize};
          --rv-h3-font-size: ${currentReaderStyleConfig.h3FontSize};
          --rv-h4-font-size: ${currentReaderStyleConfig.h4FontSize};
          --rv-h5-font-size: ${currentReaderStyleConfig.h5FontSize};
          --rv-link-color: ${currentReaderStyleConfig.linkColor};
          --rv-mark-bg: ${currentReaderStyleConfig.markBackground};
          --rv-mark-color: ${currentReaderStyleConfig.markColor};
          --rv-neutral-border-color: ${currentReaderStyleConfig.neutralBorderColor};
          --rv-neutral-color: ${currentReaderStyleConfig.neutralColor};
          --rv-p-font-size: ${currentReaderStyleConfig.paragraphFontSize};
          --rv-p-line-height: ${currentReaderStyleConfig.lineHeight};
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 16px;
          background-color: var(--rv-body-bg);
          color: var(--rv-body-color);
          font-family: var(--rv-font-family, -apple-system, system-ui, sans-serif);
          -webkit-text-size-adjust: 100%;
        }
        a { color: var(--rv-link-color); }
        img { max-width: 100%; height: auto; }
        #readable-shell {
          width: 100%;
          margin: 0 auto;
        }
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
          color: var(--rv-neutral-color);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }
        .rv-header-meta a {
          color: var(--rv-neutral-color);
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .rv-header-separator {
          border: none;
          border-top: 1px solid var(--rv-neutral-border-color);
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
      <div id="readable-shell">
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
      </div>
      <script>
        (function () {
          const initialContent = ${escapeForInlineScript(content)};
          const initialReaderStyles = JSON.parse(${initialStyles});

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

          function postSelectionContext(disableHighlightMenu) {
            postMessage("selection-context", {
              disableHighlightMenu: disableHighlightMenu,
            });
          }

          function getContainer() {
            return document.getElementById("readable-view");
          }

          function applyReaderStyles(styleConfig) {
            const root = document.documentElement;
            if (!root || !styleConfig) return;

            root.style.setProperty("--rv-body-bg", styleConfig.bodyBackground);
            root.style.setProperty("--rv-body-color", styleConfig.bodyColor);
            root.style.setProperty("--rv-code-bg", styleConfig.codeBackground);
            root.style.setProperty("--rv-font-family", styleConfig.fontFamily);
            root.style.setProperty("--rv-h1-font-size", styleConfig.h1FontSize);
            root.style.setProperty("--rv-h2-font-size", styleConfig.h2FontSize);
            root.style.setProperty("--rv-h3-font-size", styleConfig.h3FontSize);
            root.style.setProperty("--rv-h4-font-size", styleConfig.h4FontSize);
            root.style.setProperty("--rv-h5-font-size", styleConfig.h5FontSize);
            root.style.setProperty("--rv-link-color", styleConfig.linkColor);
            root.style.setProperty("--rv-mark-bg", styleConfig.markBackground);
            root.style.setProperty("--rv-mark-color", styleConfig.markColor);
            root.style.setProperty(
              "--rv-neutral-border-color",
              styleConfig.neutralBorderColor
            );
            root.style.setProperty(
              "--rv-neutral-color",
              styleConfig.neutralColor
            );
            root.style.setProperty(
              "--rv-p-font-size",
              styleConfig.paragraphFontSize
            );
            root.style.setProperty("--rv-p-line-height", styleConfig.lineHeight);
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
              if (shouldNotify) {
                postSelectionContext(false);
                postMessage("selection", null);
              }
              return null;
            }

            const range = selection.getRangeAt(0);

            if (!container.contains(range.commonAncestorContainer)) {
              state.currentSelection = null;
              state.lastValidSelection = null;
              if (shouldNotify) {
                postSelectionContext(true);
                postMessage("selection", null);
              }
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
              state.lastValidSelection = null;
              if (shouldNotify) {
                postSelectionContext(true);
                postMessage("selection", null);
              }
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
              if (shouldNotify) {
                postSelectionContext(false);
                postMessage("selection", null);
              }
              return null;
            }

            state.currentSelection = info;
            state.lastValidSelection = info;

            if (shouldNotify) {
              postSelectionContext(false);
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

          function scrollToHighlight(highlightId, attempt) {
            const container = getContainer();
            if (!container) return false;

            const highlightNodes = Array.from(
              container.querySelectorAll(
                'span[data-highlight-id="' + String(highlightId) + '"]'
              )
            );

            if (highlightNodes.length === 0) {
              if ((attempt || 0) < 8) {
                window.setTimeout(function () {
                  scrollToHighlight(highlightId, (attempt || 0) + 1);
                }, 60);
              }

              return false;
            }

            const firstNode = highlightNodes[0];

            if (firstNode instanceof HTMLElement) {
              firstNode.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            }

            return true;
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
            applyReaderStyles: applyReaderStyles,
            clearSelection: clearSelection,
            getSelectionInfo: getSelectionInfo,
            renderHighlights: renderHighlights,
            scrollToHighlight: scrollToHighlight,
          };

          applyReaderStyles(initialReaderStyles);
          setContent();
          postMessage("ready", null);
        })();
      </script>
    </body>
    </html>
  `);
    isWebViewReadyRef.current = false;
  }, [
    content,
    dateStr,
    link.id,
    link.url,
    title,
  ]);

  useEffect(() => {
    latestSelectionRef.current = null;
    pendingSelectionTextRef.current = null;
    pendingHighlightScrollIdRef.current = null;
    setDisableHighlightMenu(false);
    clearWebSelection();
    void SheetManager.hide("readable-highlight-sheet");
  }, [clearWebSelection, link.id]);

  if (!content || !webViewHtml) {
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
      syncReaderStylesToWebView(readerStyleConfig);
      syncHighlightsToWebView(linkHighlights);
      flushPendingHighlightScroll();
      return;
    }

    if (
      message?.type === "selection-context" &&
      isSelectionContext(message.payload)
    ) {
      setDisableHighlightMenu(message.payload.disableHighlightMenu);
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
      source={{ html: webViewHtml }}
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
      menuItems={
        disableHighlightMenu ? NON_HIGHLIGHT_MENU_ITEMS : DEFAULT_MENU_ITEMS
      }
      originWhitelist={["*"]}
    />
  );
});

export default ReadableFormat;
