export function diffPath(file: string): string {
  return file.replaceAll('\\', '/');
}

/** Shows every changed line in a file, with context, without writing either version. */
export function unifiedDiff(file: string, before: string, after: string): string {
  if (before === after) return '';
  const path = diffPath(file);
  const linesOf = (text: string) =>
    text === ''
      ? []
      : text
          .replace(/\n$/, '')
          .split('\n')
          .map((value, index, lines) => ({
            value,
            terminated: index < lines.length - 1 || text.endsWith('\n'),
          }));
  const oldLines = linesOf(before);
  const newLines = linesOf(after);
  const same = (
    oldLine: (typeof oldLines)[number] | undefined,
    newLine: (typeof newLines)[number] | undefined,
  ) =>
    oldLine !== undefined &&
    newLine !== undefined &&
    oldLine.value === newLine.value &&
    oldLine.terminated === newLine.terminated;
  let start = 0;
  while (
    start < oldLines.length &&
    start < newLines.length &&
    same(oldLines[start], newLines[start])
  )
    start += 1;
  let end = 0;
  while (
    end < oldLines.length - start &&
    end < newLines.length - start &&
    same(oldLines[oldLines.length - end - 1], newLines[newLines.length - end - 1])
  )
    end += 1;
  const contextStart = Math.max(0, start - 3);
  const contextEnd = Math.min(3, end);
  const oldEnd = oldLines.length - end;
  const newEnd = newLines.length - end;
  const oldCount = oldEnd - contextStart + contextEnd;
  const newCount = newEnd - contextStart + contextEnd;
  const display = (lines: typeof oldLines, prefix: string) =>
    lines.flatMap(line => [
      `${prefix}${line.value}`,
      ...(line.terminated ? [] : ['\\ No newline at end of file']),
    ]);
  const body = [
    ...display(oldLines.slice(contextStart, start), ' '),
    ...display(oldLines.slice(start, oldEnd), '-'),
    ...display(newLines.slice(start, newEnd), '+'),
    ...display(oldLines.slice(oldEnd, oldEnd + contextEnd), ' '),
  ];
  return [
    `diff --git a/${path} b/${path}`,
    `--- ${before === '' ? '/dev/null' : `a/${path}`}`,
    `+++ b/${path}`,
    `@@ -${oldCount === 0 ? 0 : contextStart + 1},${oldCount} +${newCount === 0 ? 0 : contextStart + 1},${newCount} @@`,
    ...body,
  ].join('\n');
}
