/**
 * The permission names this module checks. They are the backend's own, so a page and a
 * menu entry can be hidden by the same name the server authorizes with.
 */
export const SamplePolicyNames = {
  Sample: 'Sample.Sample',
  SampleCreate: 'Sample.Sample.Create',
  SampleUpdate: 'Sample.Sample.Update',
  SampleDelete: 'Sample.Sample.Delete',
} as const;

export type SamplePolicyName = (typeof SamplePolicyNames)[keyof typeof SamplePolicyNames];
