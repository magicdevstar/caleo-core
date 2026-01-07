// ----------------------------------------------------------------------

export interface ExtendFile extends File {
  preview?: string;
  path?: string;
  lastModifiedDate?: string;
  displayName?: string;
  existing?: boolean;
  attachmentPath?: string;
  modified?: boolean;
}
