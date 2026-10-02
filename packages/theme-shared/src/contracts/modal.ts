export interface AbpModalProps {
  visible: boolean;
  /** Blocks the footer buttons and the close paths while something is in flight. */
  busy?: boolean | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  centered?: boolean | undefined;
  /** Marks changes made by controls that do not emit native input events. */
  dirty?: boolean | undefined;
  /** Lets an unsaved form close without the "are you sure" step. */
  suppressUnsavedChangesWarning?: boolean | undefined;
  /**
   * Names the dialog when there is no header to name it. A dialog with neither is one
   * a screen reader announces as nothing at all.
   */
  ariaLabel?: string | undefined;
}

export interface AbpModalEmits {
  'update:visible': [value: boolean];
  /** Once per open, before the dialog is in the document. */
  init: [];
  appear: [];
  disappear: [];
}

export interface AbpModalSlots {
  header?: () => unknown;
  default?: () => unknown;
  /** Requests a user close, including the unsaved changes confirmation. */
  footer?: (context: { close: () => Promise<void> }) => unknown;
}
