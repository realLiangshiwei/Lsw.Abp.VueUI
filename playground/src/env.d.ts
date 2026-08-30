interface ImportMetaEnv {
  /** Base URL of the ABP backend, the second of `loadRuntimeConfig`'s three levels. */
  readonly VITE_API_URL: string;
  /**
   * `code` hands the visitor to the identity server; anything else uses the password
   * flow and the login form under `/account/login`.
   */
  readonly VITE_AUTH_RESPONSE_TYPE: string;
}
