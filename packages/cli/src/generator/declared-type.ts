import { parseClrType } from './clr-type.js';
import type { RenderedType, TypeRegistry } from './type-registry.js';

/** What the backend says about one type: the simplified name, and the CLR one behind it. */
export interface DeclaredType {
  type: string;
  typeSimple: string;
}

/**
 * The TypeScript for a property, a parameter or a return value.
 *
 * `typeSimple` is the better source -- it has the primitives resolved already -- except
 * for an enum, which it flattens to the word `enum`; there the CLR name is the only place
 * the member type still exists.
 *
 * @param registry The types the backend described
 * @param declared The type as the backend wrote it, in both forms
 * @param scope Generic parameter names that are in scope where the text lands
 */
export function renderDeclaredType(
  registry: TypeRegistry,
  declared: DeclaredType,
  scope: ReadonlySet<string> = new Set(),
): RenderedType {
  const simple = parseClrType(declared.typeSimple);
  const mentionsEnum = /(^|[[{:,<])enum([\]}:,>]|$)/.test(declared.typeSimple);

  return registry.render(mentionsEnum ? parseClrType(declared.type) : simple, scope);
}
