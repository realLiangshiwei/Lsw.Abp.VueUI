import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'vue/compiler-sfc';
import ts from 'typescript';
import { format, resolveConfig } from 'prettier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docs = join(root, 'docs');
const metadata = JSON.parse(readFileSync(join(docs, '.vitepress/reference.json'), 'utf8'));
const tick = String.fromCharCode(96);
const inline = value => tick + value + tick;
const block = (language, value) => tick.repeat(3) + language + '\n' + value + '\n' + tick.repeat(3);
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
const counts = { api: 0, components: 0 };
for (const locale of ['en', 'zh']) {
  const words = metadata.labels[locale];
  const prefix = locale === 'zh' ? 'zh/' : '';
  for (const item of metadata.components) {
    const api = componentApi(item);
    const content = [
      '# ' + item.name,
      item.description[locale],
      '[' + words.source + '](' + sourceLink(join(root, item.source)) + ')',
      '## ' + words.example,
      block(item.language ?? 'vue', item.example),
    ];
    if (item.notes?.[locale]) content.push('## ' + words.behavior, item.notes[locale]);
    content.push(
      '## Props',
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
      '## Events',
      api.emits.length
        ? table(
            api.emits.map(event => [inline(event.name), inline(event.type)]),
            [words.name, words.payload],
          )
        : words.noEvents,
    );
    content.push(
      '## Slots',
      api.slots.length
        ? table(
            api.slots.map(slot => [inline(slot.name), inline(slot.type)]),
            [words.name, words.context],
          )
        : words.noSlots,
    );
    content.push(
      words.attributes,
      '[' + words.related + '](/' + prefix + 'api/' + item.package + ')',
    );
    await write(prefix + 'components/' + item.slug + '.md', content.join('\n\n'));
    counts.components++;
  }
  for (const directory of readdirSync(join(root, 'packages'))) {
    const folder = join(root, 'packages', directory);
    const manifestPath = join(folder, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(read(manifestPath));
    if (!manifest.exports) continue;
    const entries = [];
    let firstValue;
    for (const entry of Object.keys(manifest.exports)) {
      if (entry === './package.json' || entry.endsWith('.css')) continue;
      const segment = entry === '.' ? '' : entry.slice(2);
      const candidates = segment
        ? [join(folder, segment, 'src/index.ts'), join(folder, 'src', segment, 'index.ts')]
        : [join(folder, 'src/index.ts')];
      const file = candidates.find(existsSync);
      if (!file) throw new Error('No public source entry for ' + manifest.name + '/' + segment);
      const source = tree(file);
      const symbols = [];
      for (const node of source.statements) {
        if (
          !ts.isExportDeclaration(node) ||
          !node.exportClause ||
          !ts.isNamedExports(node.exportClause)
        )
          continue;
        for (const symbol of node.exportClause.elements) {
          const original = symbol.propertyName?.text ?? symbol.name.text;
          const target =
            node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
              ? resolve(dirname(file), node.moduleSpecifier.text.replace(/\.js$/, '.ts'))
              : file;
          const actual = existsSync(target)
            ? target
            : node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
              ? resolve(dirname(file), node.moduleSpecifier.text)
              : file;
          symbols.push([
            inline(symbol.name.text),
            node.isTypeOnly || symbol.isTypeOnly ? words.typeOnly : words.value,
            '[' + words.source + '](' + sourceLink(actual) + ')',
          ]);
          if (original === 'default' && !existsSync(actual))
            throw new Error('Missing component source: ' + actual);
        }
      }
      if (!segment)
        firstValue = symbols.find(symbol => symbol[1] === words.value)?.[0].slice(1, -1);
      const importPath = manifest.name + (segment ? '/' + segment : '');
      entries.push(
        '## ' + inline(importPath),
        table(symbols, [words.export, words.kind, words.source]),
      );
    }
    const content = [
      '# ' + manifest.name,
      words.apiIntro,
      words.version,
      '## ' + words.imports,
      block('ts', 'import { ' + firstValue + " } from '" + manifest.name + "';"),
      ...entries,
    ];
    if (manifest.exports['./style.css'])
      content.push('## CSS', block('ts', "import '" + manifest.name + "/style.css';"));
    await write(prefix + 'api/' + directory + '.md', content.join('\n\n'));
    counts.api++;
  }
}
console.log(
  'Documentation references: ' +
    counts.components +
    ' component pages, ' +
    counts.api +
    ' package pages.',
);
