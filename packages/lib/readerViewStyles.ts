export const READER_VIEW_DEFAULTS = {
  fontSize: 18,
  lineHeight: 1.8,
  headingLineHeight: 1.4,
  paragraphMargin: 16,
  h1Size: 35,
  h2Size: 30,
  h3Size: 26,
  h4Size: 21,
  h5Size: 18,
} as const;

export const readerViewCSS = `
.reader-view,
.reader-view * {
  text-align: inherit;
  overflow-wrap: anywhere;
  word-break: normal;
  hyphens: manual;
}
.reader-view mark {
  background-color: var(--rv-mark-bg);
  color: var(--rv-mark-color);
  border-radius: 5px;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
.reader-view p {
  font-size: var(--rv-p-font-size, ${READER_VIEW_DEFAULTS.fontSize}px);
  line-height: var(--rv-p-line-height, ${READER_VIEW_DEFAULTS.lineHeight});
  margin-bottom: ${READER_VIEW_DEFAULTS.paragraphMargin}px;
  margin-top: ${READER_VIEW_DEFAULTS.paragraphMargin}px;
}
.reader-view h1 {
  font-size: var(--rv-h1-font-size, ${READER_VIEW_DEFAULTS.h1Size}px);
  line-height: ${READER_VIEW_DEFAULTS.headingLineHeight};
}
.reader-view h2 {
  font-size: var(--rv-h2-font-size, ${READER_VIEW_DEFAULTS.h2Size}px);
  line-height: ${READER_VIEW_DEFAULTS.headingLineHeight};
}
.reader-view h3 {
  font-size: var(--rv-h3-font-size, ${READER_VIEW_DEFAULTS.h3Size}px);
  line-height: ${READER_VIEW_DEFAULTS.headingLineHeight};
}
.reader-view h4 {
  font-size: var(--rv-h4-font-size, ${READER_VIEW_DEFAULTS.h4Size}px);
  line-height: ${READER_VIEW_DEFAULTS.headingLineHeight};
}
.reader-view h5 {
  font-size: var(--rv-h5-font-size, ${READER_VIEW_DEFAULTS.h5Size}px);
  line-height: ${READER_VIEW_DEFAULTS.headingLineHeight};
}
.reader-view li {
  list-style: inside;
  margin-left: 2rem;
}
.reader-view a {
  text-decoration: underline;
}
.reader-view b {
  font-weight: bolder;
}
.reader-view pre,
.reader-view code {
  font-family: "Courier New", Courier, monospace;
}
.reader-view blockquote {
  opacity: 50%;
  padding-left: 1.5rem;
  border-left: solid 3px;
}
.reader-view img {
  max-width: 100%;
  height: auto;
  margin: auto;
  margin-top: 2rem;
  margin-bottom: 2rem;
  border-radius: 10px;
}
.reader-view pre {
  padding: 1rem;
  line-height: normal;
  white-space: pre-wrap;
}
.reader-view code {
  padding: 0.15rem 0.4rem 0.15rem 0.4rem;
}
.reader-view code,
.reader-view pre {
  background-color: var(--rv-code-bg);
  border-radius: 8px;
}
.reader-view ul[data-type="taskList"] {
  list-style: none;
  margin-left: 0;
  padding: 0;
}
.reader-view ul[data-type="taskList"] li {
  align-items: center;
  display: flex;
}
.reader-view ul[data-type="taskList"] li > label {
  flex: 0 0 auto;
  margin-right: 0.5rem;
  user-select: none;
}
.reader-view ul[data-type="taskList"] li > div {
  flex: 1 1 auto;
}
.reader-view ul[data-type="taskList"] input[type="checkbox"] {
  cursor: pointer;
}
.read-only ul[data-type="taskList"] {
  pointer-events: none;
}
`;

export function readerViewThemeVars(
  theme: {
    primary: string;
    "base-content": string;
  },
  isDark: boolean
): string {
  return `
    --rv-code-bg: ${isDark ? "rgb(49, 49, 49)" : "rgb(230, 230, 230)"};
    --rv-mark-bg: ${theme.primary}80;
    --rv-mark-color: ${theme["base-content"]};
  `;
}
