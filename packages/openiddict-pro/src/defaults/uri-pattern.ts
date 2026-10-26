const character = "(?:[a-z0-9._~!$&'()*+,;=-]|%[a-f0-9]{2})";
const path = `(?:${character}|[:@/])*`;
const query = `(?:${character}|[:@/?])*`;
const authority = `(?:(?:${character}|:)*@)?(?:\\[[a-f0-9:.]{2,}\\]|${character}*)(?::[0-9]*)?`;

export const defaultUriPattern = new RegExp(
  `^[a-z][a-z0-9+.-]*:(?://${authority}(?:/${path})?|/?(?!/)${path})(?:\\?${query})?(?:#${query})?$`,
  'i',
);
