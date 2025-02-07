export interface Option {
  label: string;
  value?: string | number;
  __isNew__?: boolean;
}

export interface ArchivalTagOption extends Option {
  archiveAsScreenshot: boolean | null;
  archiveAsMonolith: boolean | null;
  archiveAsPDF: boolean | null;
  archiveAsReadable: boolean | null;
  archiveAsWaybackMachine: boolean | null;
  aiTag: boolean | null;
  newTag: boolean | null;
}

export type ArchivalOptionKeys = keyof Omit<
  ArchivalTagOption,
  "label" | "value" | "__isNew__"
>;
