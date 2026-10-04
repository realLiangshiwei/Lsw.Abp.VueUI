export const searchOptions = {
  // VitePress serializes this callback, so it must not capture module-local state.
  tokenize: (text: string): string[] =>
    [...new Intl.Segmenter('zh', { granularity: 'word' }).segment(text)]
      .filter(part => part.isWordLike)
      .map(part => part.segment),
};
