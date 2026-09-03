export interface AbpModalProps {
  visible: boolean;
  /** Blocks the footer buttons and the close paths while something is in flight. */
  busy?: boolean | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl' | undefined;
  centered?: boolean | undefined;
  /** Lets an unsaved form close without the "are you sure" step. */
  suppressUnsavedChangesWarning?: boolean | undefined;
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
  footer?: () => unknown;
}
