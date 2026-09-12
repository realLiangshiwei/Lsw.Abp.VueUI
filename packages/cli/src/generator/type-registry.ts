import type { TypeDefinition } from '../api-definition/models.js';
import { namespaceOf, parseClrType, shortName, typePoolKey, type ClrType } from './clr-type.js';
import {
  FRAMEWORK_TYPES,
  isCollectionType,
  isDictionaryType,
  REMOTE_STREAM_TYPES,
  SIMPLE_TYPES,
  SYSTEM_TYPES,
} from './framework-types.js';
import type { GenerationReport } from './report.js';
import { resolveUniqueNames } from './unique-names.js';

export interface RegisteredType {
  /** How the type is filed in the pool, generic arity included. */
  key: string;
  /** The CLR name without its generic arity. */
  name: string;
  /** Where the file goes, after the root namespace has been taken off. */
  namespace: string;
  /** What the type is called in TypeScript, renamed if two of them collided. */
  identifier: string;
  isEnum: boolean;
  genericParameters: string[];
  /** Parallel to the parameters; a non-generic sibling of the same name needs these. */
  genericDefaults: (string | undefined)[];
  definition: TypeDefinition;
  /** Set when `@lsw-abpvue/core` declares it and nothing is generated for it. */
  frameworkName: string | undefined;
}

export interface TypeRegistryOptions {
  /** Taken off the front of every namespace, the way the Angular schematics do it. */
  rootNamespace?: string | undefined;
  report: GenerationReport;
}

export interface RenderedType {
  text: string;
  /** The types the text mentions, so the file can import them. */
  refs: RegisteredType[];
}

/** `Acme.BookStore.Books` under root `Acme.BookStore` is `Books`. */
export function stripRootNamespace(namespace: string, root: string | undefined): string {
  if (!root) return namespace;
  if (namespace === root) return '';

  const stripped = namespace.startsWith(`${root}.`) ? namespace.slice(root.length + 1) : namespace;

  // ABP's own controllers sit in a `Controllers` sub-namespace that says nothing about
  // the API; Angular drops it and so does this, so the two lay out the same tree.
  return stripped.replace(/^Controllers\./, '');
}

/**
 * Every type the backend describes, under the name it will have in TypeScript. Two
 * namespaces with a type of the same name are the reason this exists: the second one
 * gets its namespace in front of it rather than silently overwriting the first.
 */
export class TypeRegistry {
  private readonly byKey = new Map<string, RegisteredType>();
  private readonly report: GenerationReport;

  constructor(types: Record<string, TypeDefinition>, options: TypeRegistryOptions) {
    this.report = options.report;

    const families = new Map<string, string[]>();
    for (const key of Object.keys(types)) {
      const name = key.replace(/<.*>$/, '');
      families.set(name, [...(families.get(name) ?? []), key]);
    }

    const identifiers = resolveUniqueNames(
      [...families.keys()].map(name => ({
        key: name,
        namespace: namespaceOf(name),
        preferred: shortName(name),
      })),
      this.report,
    );

    for (const [name, keys] of families) {
      for (const key of keys) {
        const definition = types[key] as TypeDefinition;

        this.byKey.set(key, {
          key,
          name,
          namespace: stripRootNamespace(namespaceOf(name), options.rootNamespace),
          identifier: identifiers.get(name) ?? shortName(name),
          isEnum: definition.isEnum,
          genericParameters: definition.genericArguments ?? [],
          genericDefaults: this.defaultsFor(name, keys, types),
          definition,
          frameworkName: FRAMEWORK_TYPES.get(name),
        });
      }
    }
  }

  /**
   * A non-generic type whose base is its own generic form -- ABP's `NameValue` over
   * `NameValue<T>` -- is one type in TypeScript, and the arguments the base was closed
   * with become the parameter defaults.
   */
  private defaultsFor(
    name: string,
    keys: string[],
    types: Record<string, TypeDefinition>,
  ): (string | undefined)[] {
    const generic = keys.find(key => (types[key]?.genericArguments ?? []).length > 0);
    if (!generic || keys.length < 2) return [];

    const closing = keys
      .filter(key => key !== generic)
      .map(key => types[key]?.baseType)
      .find(baseType => baseType && baseType.replace(/<.*>$/, '') === name);

    if (!closing) return [];

    const parsed = parseClrType(closing);
    return parsed.kind === 'name' ? parsed.args.map(argument => this.render(argument).text) : [];
  }

  get(key: string): RegisteredType | undefined {
    return this.byKey.get(key);
  }

  find(type: ClrType): RegisteredType | undefined {
    return type.kind === 'name' ? this.byKey.get(typePoolKey(type)) : undefined;
  }

  /** Every type that will be written to a file, which excludes what core already has. */
  generated(): RegisteredType[] {
    return [...this.byKey.values()].filter(type => !type.frameworkName);
  }

  /**
   * The TypeScript for one CLR type.
   * @param type The parsed CLR type
   * @param scope Generic parameter names that are in scope where the text lands
   */
  render(type: ClrType, scope: ReadonlySet<string> = new Set()): RenderedType {
    const refs: RegisteredType[] = [];
    const text = this.renderInto(type, scope, refs);

    return { text, refs };
  }

  private renderInto(type: ClrType, scope: ReadonlySet<string>, refs: RegisteredType[]): string {
    if (type.kind === 'array') {
      return `${this.renderInto(type.item, scope, refs)}[]`;
    }

    if (type.kind === 'dictionary') {
      const key = this.renderInto(type.key, scope, refs);
      const value = this.renderInto(type.value, scope, refs);
      return `Record<${key}, ${value}>`;
    }

    const { name, args } = type;

    if (scope.has(name)) return name;

    const simple = SIMPLE_TYPES.get(name) ?? SYSTEM_TYPES.get(name);
    if (simple) return simple;

    if (REMOTE_STREAM_TYPES.has(name)) return 'Blob';

    const first = args[0];
    if (isCollectionType(name) && first && args.length === 1) {
      return `${this.renderInto(first, scope, refs)}[]`;
    }

    const second = args[1];
    if (isDictionaryType(name) && first && second) {
      const key = this.renderInto(first, scope, refs);
      const value = this.renderInto(second, scope, refs);
      return `Record<${key}, ${value}>`;
    }

    const registered = this.byKey.get(typePoolKey(type));
    if (registered) {
      refs.push(registered);
      const rendered = args.map(argument => this.renderInto(argument, scope, refs));
      return rendered.length
        ? `${registered.identifier}<${rendered.join(', ')}>`
        : registered.identifier;
    }

    const framework = FRAMEWORK_TYPES.get(name);
    if (framework) {
      const rendered = args.map(argument => this.renderInto(argument, scope, refs));
      return rendered.length ? `${framework}<${rendered.join(', ')}>` : framework;
    }

    // A single upper-case letter followed by anything is how the CLR writes a type
    // parameter, and one that is not in scope here belongs to a base type.
    if (/^T[A-Z0-9]?[A-Za-z0-9]*$/.test(name) && !name.includes('.')) return name;

    this.report.add('unresolved', `${name} is not in the type pool; generated as unknown.`);

    return 'unknown';
  }
}
