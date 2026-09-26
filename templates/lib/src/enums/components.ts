/**
 * The component keys of this module's pages. A host replaces a page by its key, and a
 * contributor addresses an extension point by it, so the value is part of the module's
 * public API: pick it once and keep it.
 */
export const SampleComponents = {
  Sample: 'Sample.SampleComponent',
} as const;

export type SampleComponent = (typeof SampleComponents)[keyof typeof SampleComponents];
