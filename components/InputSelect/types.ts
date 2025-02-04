export interface Option {
  label: string;
  value?: string | number;
}

export interface ArchivalTagOption extends Option {
  archiveAsScreenshot?: boolean;
  archiveAsMonolith?: boolean;
  archiveAsPDF?: boolean;
  archiveAsReadable?: boolean;
  archiveAsWaybackMachine?: boolean;
  aiTag?: boolean;
}