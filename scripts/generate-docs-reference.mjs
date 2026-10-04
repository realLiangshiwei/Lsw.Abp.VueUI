import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'vue/compiler-sfc';
import ts from 'typescript';
import { format, resolveConfig } from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');
const metadata = JSON.parse(readFileSync(join(docs, '.vitepress/reference.json'), 'utf8'));
const tick = String.fromCharCode(96);
const inline = value => tick + value.trim().replace(/^\|\s*/, '') + tick;
const clean = value => value.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
const sourceLink = file =>
  'https://github.com/realLiangshiwei/Lsw.Abp.VueUI/blob/main/' +
  relative(root, file).replaceAll('\\', '/');
const read = file => readFileSync(file, 'utf8');
const tree = (file, text = read(file)) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const formatting = await resolveConfig(join(root, '.prettierrc.json'));
const write = async (path, text) => {
  const target = join(docs, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, await format(text.trim() + '\n', { ...formatting, filepath: target }));
};
function walk(node, visit) {
  visit(node);
  ts.forEachChild(node, child => walk(child, visit));
}
function typeMembers(type, source) {
  if (!type) return [];
  if (ts.isIntersectionTypeNode(type)) return type.types.flatMap(item => typeMembers(item, source));
  if (!ts.isTypeLiteralNode(type) && !ts.isInterfaceDeclaration(type)) return [];
  return type.members.map(member => ({
    name:
      member.name?.getText(source).replace(/^['"]|['"]$/g, '') ??
      (ts.isIndexSignatureDeclaration(member)
        ? member.parameters[0]?.type?.getText(source)
        : member.getText(source).split(':')[0]) ??
      'unknown',
    type: member.type?.getText(source) ?? member.getText(source),
    optional: Boolean(member.questionToken),
  }));
}
function contractMembers(file, name) {
  if (!existsSync(file)) return [];
  const source = tree(file);
  const declaration = source.statements.find(
    node => ts.isInterfaceDeclaration(node) && node.name.text === name,
  );
  return declaration ? typeMembers(declaration, source) : [];
}
function componentApi(item) {
  const file = join(root, item.source);
  const descriptor = parse(read(file), { filename: file }).descriptor;
  const source = tree(file + '.ts', descriptor.scriptSetup?.content ?? '');
  const result = { props: [], emits: [], slots: [], defaults: {} };
  const contract = item.contract ? join(root, item.contract) : undefined;
  function fields(node, suffix) {
    const type = node.typeArguments?.[0];
    if (type && ts.isTypeReferenceNode(type) && contract)
      return contractMembers(contract, type.typeName.getText(source));
    if (contract) return contractMembers(contract, item.name + suffix);
    return typeMembers(type, source);
  }
  walk(source, node => {
    if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return;
    const name = node.expression.text;
    if (name === 'defineProps') result.props = fields(node, 'Props');
    if (name === 'defineEmits') result.emits = fields(node, 'Emits');
    if (name === 'defineSlots') result.slots = fields(node, 'Slots');
    if (
      name === 'withDefaults' &&
      node.arguments[1] &&
      ts.isObjectLiteralExpression(node.arguments[1])
    ) {
      for (const property of node.arguments[1].properties) {
        if (ts.isPropertyAssignment(property))
          result.defaults[property.name.getText(source)] = property.initializer.getText(source);
      }
    }
    if (name === 'defineModel') {
      const named = node.arguments[0] && ts.isStringLiteral(node.arguments[0]);
      const property = named ? node.arguments[0].text : 'modelValue';
      const options = node.arguments[named ? 1 : 0];
      const entries =
        options && ts.isObjectLiteralExpression(options)
          ? options.properties.filter(ts.isPropertyAssignment)
          : [];
      const required =
        entries.find(entry => entry.name.getText(source) === 'required')?.initializer.kind ===
        ts.SyntaxKind.TrueKeyword;
      const initial = entries.find(entry => entry.name.getText(source) === 'default');
      const type = node.typeArguments?.[0]?.getText(source) ?? 'unknown';
      result.props.push({ name: property, type, optional: !required });
      result.emits.push({
        name: 'update:' + property,
        type: '[value: ' + type + ']',
        optional: false,
      });
      if (initial) result.defaults[property] = initial.initializer.getText(source);
    }
  });
  if (contract && !result.slots.length)
    result.slots = contractMembers(contract, item.name + 'Slots');
  if (item.slots) result.slots.push(...item.slots);
  return result;
}
function table(rows, columns) {
  return [
    '| ' + columns.join(' | ') + ' |',
    '| ' + columns.map(() => '---').join(' | ') + ' |',
    ...rows.map(row => '| ' + row.map(clean).join(' | ') + ' |'),
  ].join('\n');
}
let componentCount = 0;
const start = '<!-- component-contract:start -->';
const end = '<!-- component-contract:end -->';
for (const locale of ['en', 'zh']) {
  const words = metadata.labels[locale];
  const prefix = locale === 'zh' ? 'zh/' : '';
  for (const item of metadata.components) {
    const api = componentApi(item);
    const content = [
      '## ' + (locale === 'zh' ? '属性、事件与插槽' : 'Props, events and slots'),
      '[' + words.source + '](' + sourceLink(join(root, item.source)) + ')',
      locale === 'zh'
        ? '类型来自公开契约，默认表达式来自当前实现。短横线表示没有显式默认值；省略的可选布尔属性通常为 false。'
        : 'Types come from the public contract and defaults from the current implementation. A dash means no explicit default; optional boolean props are normally false when omitted.',
    ];
    content.push(
      '### Props',
      api.props.length
        ? table(
            api.props.map(prop => [
              inline(prop.name),
              inline(prop.type),
              prop.optional ? words.no : words.yes,
              api.defaults[prop.name] ? inline(api.defaults[prop.name]) : '—',
            ]),
            [words.name, words.type, words.required, words.default],
          )
        : words.noProps,
    );
    content.push(
      '### Events',
      api.emits.length
        ? table(
            api.emits.map(event => [inline(event.name), inline(event.type)]),
            [words.name, words.payload],
          )
        : words.noEvents,
    );
    content.push(
      '### Slots',
      api.slots.length
        ? table(
            api.slots.map(slot => [inline(slot.name), inline(slot.type)]),
            [words.name, words.context],
          )
        : words.noSlots,
    );
    const path = prefix + 'components/' + item.slug + '.md';
    const body = read(join(docs, path));
    const from = body.indexOf(start);
    const to = body.indexOf(end);
    if (from < 0 || to <= from) throw new Error('Missing component contract markers in ' + path);
    await write(
      path,
      body.slice(0, from) + start + '\n\n' + content.join('\n\n') + '\n\n' + body.slice(to),
    );
    componentCount++;
  }
}
console.log('Documentation references: ' + componentCount + ' component pages.');
