# @lsw-abpvue/utils

Framework-agnostic helpers for [Lsw.Abp.VueUI](https://github.com/realLiangshiwei/Lsw.Abp.VueUI),
an **unofficial** Vue UI for the [ABP Framework](https://abp.io). No dependencies, not even Vue.

```bash
pnpm add @lsw-abpvue/utils
```

## What is in it

| | |
|---|---|
| `LinkedList` / `ListNode` | Ordered list the extension system builds contributions on. A contributor writes `list.add(prop).after(p => p.name === 'userName')` and it keeps meaning the same thing after somebody inserts another column upstream. |
| `interpolate(text, params)` | Fills the `{0}` `{1}` placeholders ABP's localization resources come with. |
| `deepMerge(target, source)` / `isPlainObject(value)` | Merges configuration objects, source winning wherever it is defined. |

## License

MIT. Not affiliated with or endorsed by Volosoft or the ABP Framework team.
