export interface Option {
  label: string;
  value?: string | number;
  __isNew__?: boolean;
}

export interface ArchivalTagOption extends Option {
  archiveAsScreenshot: boolean;
  archiveAsMonolith: boolean;
  archiveAsPDF: boolean;
  archiveAsReadable: boolean;
  archiveAsWaybackMachine: boolean;
  aiTag: boolean;
}

export type ArchivalOptionKeys = keyof Omit<ArchivalTagOption, "label" | "value" | "__isNew__">;
