/** The localization keys of this module's menu entries. */
export const SampleRouteNames = {
  Sample: 'Sample::Menu:Sample',
} as const;

export type SampleRouteName = (typeof SampleRouteNames)[keyof typeof SampleRouteNames];
