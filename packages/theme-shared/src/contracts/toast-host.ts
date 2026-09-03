export interface AbpToastHostProps {
  /**
   * Renders only the toasts published under the same key, so a dialog can show its own
   * without them landing behind it.
   */
  containerKey?: string | undefined;
}
