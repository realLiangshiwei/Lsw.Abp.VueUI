import {
  ABP_INJECTOR_KEY,
  createInjector,
  LocalizationService,
  type Injector,
  type LocalizationParam,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { DOMWrapper, mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import { expect } from 'vitest';
import { nextTick, type Component } from 'vue';

export interface ThemeUnderTest {
  /** Shown in the test names, so a failure says which theme failed. */
  name: string;
  /** Everything needed to resolve the twelve contracts, e.g. `provideAbpThemeBasic()`. */
  providers: readonly ProviderInput[];
  /**
   * Opens an overlay control. The default clicks whatever has `aria-expanded`, which
   * both the listbox and the combobox pattern put on the trigger.
   */
  open?: ((wrapper: VueWrapper) => Promise<void>) | undefined;
}

export interface RenderedContract {
  wrapper: VueWrapper;
  /** For reaching the services a host renders from, such as the toaster. */
  injector: Injector;
  /**
   * The arguments of each emit, in order. Recorded through handler props rather than
   * `wrapper.emitted()`, because the theme's implementation is a child of the contract
   * component and a parent only ever sees its emits as the handlers it passed down --
   * which is exactly what this asserts.
   * @param event Event name, e.g. `update:modelValue`
   */
  emitted(event: string): unknown[][];
}

export interface RenderOptions {
  props?: Record<string, unknown> | undefined;
  slots?: Record<string, unknown> | undefined;
  /** Events to record, e.g. `['update:modelValue']`. */
  events?: readonly string[] | undefined;
  /** Extra providers for this one mount, on top of the theme's. */
  providers?: readonly ProviderInput[] | undefined;
}

/**
 * Mounts a contract component against a theme. Attached to the document, because half of
 * what the contract is about -- focus, keyboard, live regions -- does not exist detached.
 * @param theme The theme under test
 * @param component The contract component, e.g. `AbpButton`
 * @param options Props, slots, and providers for this mount
 */
export function renderContract(
  theme: ThemeUnderTest,
  component: unknown,
  options: RenderOptions = {},
): RenderedContract {
  const injector = createInjector([...theme.providers, ...(options.providers ?? [])]);
  const recorded = new Map<string, unknown[][]>();
  const handlers: Record<string, (...args: unknown[]) => void> = {};

  for (const event of options.events ?? []) {
    recorded.set(event, []);
    handlers[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = (...args) => {
      recorded.get(event)?.push(args);
    };
  }

  const wrapper = mount(component as Component, {
    props: { ...options.props, ...handlers },
    slots: options.slots as Record<string, string>,
    attachTo: document.body,
    global: {
      provide: { [ABP_INJECTOR_KEY]: injector },
      // Not a stand-in: `$t` is a global property every ABP application has, installed
      // by core's setup hook, and a theme's templates are written expecting it.
      mocks: {
        $t: (key: LocalizationParam, ...params: unknown[]) =>
          injector.get(LocalizationService).t(key, ...params),
      },
    },
  });

  return { wrapper, injector, emitted: event => recorded.get(event) ?? [] };
}

/**
 * Every match under `root`, shadow roots included. A theme built out of custom elements
 * -- Fluent UI is -- puts its input inside one, and `querySelectorAll` stops at the
 * boundary, so a suite that used it would be a suite only light-DOM themes could pass.
 * @param root Where to start
 * @param selector CSS selector
 */
function queryDeep(root: ParentNode, selector: string): Element[] {
  const found = [...root.querySelectorAll(selector)];

  for (const element of root.querySelectorAll('*')) {
    if (element.shadowRoot) found.push(...queryDeep(element.shadowRoot, selector));
  }

  return found;
}

/**
 * Waits for what a theme renders asynchronously. An overlay is usually teleported and
 * mounted a tick later, so looking for it in the same turn finds nothing.
 * @param rendered What `renderContract` returned
 */
export async function settle(rendered: RenderedContract): Promise<void> {
  await rendered.wrapper.vm.$nextTick();
  await rendered.wrapper.vm.$nextTick();
}

/**
 * Finds a rendered element whether the theme left it in place or teleported it. An
 * overlay usually is teleported, and where it ends up in the document is a theme's
 * business rather than a contract.
 * @param rendered What `renderContract` returned
 * @param selector CSS selector, normally a role
 */
export function findRendered(
  rendered: RenderedContract,
  selector: string,
): DOMWrapper<Element> | null {
  return findAllRendered(rendered, selector)[0] ?? null;
}

/** Every match, in the wrapper or in the document. @see findRendered */
export function findAllRendered(
  rendered: RenderedContract,
  selector: string,
): DOMWrapper<Element>[] {
  const root = rendered.wrapper.element as Partial<Element>;
  // `querySelectorAll` looks below the root, and a contract component whose whole output
  // is one element -- an input, a button -- is the root.
  const own = root.matches?.(selector) ? [root as Element] : [];
  const inside = root.querySelectorAll ? [...own, ...queryDeep(root as ParentNode, selector)] : [];
  const found = inside.length > 0 ? inside : queryDeep(document, selector);

  return found.map(element => new DOMWrapper(element));
}

/**
 * Picks an option, whichever pattern the theme chose: a native `select` is set, a
 * listbox is opened and clicked.
 * @param theme The theme under test
 * @param rendered What `renderContract` returned
 * @param option The option to pick, by label and value
 */
export async function chooseOption(
  theme: ThemeUnderTest,
  rendered: RenderedContract,
  option: { label: string; value: string },
): Promise<void> {
  const native = rendered.wrapper.find('select');

  if (native.exists()) {
    await native.setValue(option.value);
    return;
  }

  await openOverlay(theme, rendered.wrapper);
  const item = findAllRendered(rendered, '[role="option"]').find(
    entry => entry.text() === option.label,
  );

  // A listbox commits on pointer up, but only for an item the pointer has moved onto:
  // the gesture that opened it must not select whatever is underneath. A plain button
  // commits on click. Doing all three is what a real pointer does anyway.
  if (item) {
    await pointer(item.element, 'pointermove');
    await pointer(item.element, 'pointerup');
    await item.trigger('click');
  }
  await settle(rendered);
}

/**
 * Dispatches a real pointer event. `trigger()` builds a plain `Event` for a type it does
 * not know, and a widget that listens for pointer events does not react to one.
 * @param element What the user would be pointing at
 * @param type `pointerdown`, `pointerup`
 */
export async function pointer(element: Element, type: string): Promise<void> {
  const Constructor =
    (globalThis as { PointerEvent?: typeof MouseEvent }).PointerEvent ?? MouseEvent;

  // Not cancelable: a widget that guards on `defaultPrevented` would otherwise skip the
  // gesture, because something else in its own overlay machinery got there first.
  element.dispatchEvent(new Constructor(type, { bubbles: true, button: 0 }));
  await nextTick();
}

/** Opens an overlay control the way its ARIA pattern says it opens. */
export async function openOverlay(theme: ThemeUnderTest, wrapper: VueWrapper): Promise<void> {
  if (theme.open) {
    await theme.open(wrapper);
    return;
  }

  const trigger = wrapper.find('[aria-expanded]');
  // A listbox trigger usually opens on pointer down rather than on click.
  await pointer(trigger.element, 'pointerdown');
  if (trigger.attributes('aria-expanded') !== 'true') await trigger.trigger('click');
  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();
}

/**
 * Flips a checkbox, a switch or one option of a radio group, whether the theme built it
 * out of a native input or out of an element with the matching role.
 * @param rendered What `renderContract` returned
 * @param label The option to pick, for a radio group
 */
export async function activateToggle(rendered: RenderedContract, label?: string): Promise<void> {
  const selector =
    'input[type="checkbox"], input[type="radio"], [role="checkbox"], [role="switch"], [role="radio"]';
  const controls = findAllRendered(rendered, selector);
  const control = label
    ? controls.find(item => item.attributes('value') === label || item.text() === label)
    : controls[0];

  if (!control) return;

  const element = control.element as HTMLInputElement;
  if (element.tagName === 'INPUT') {
    await control.setValue(element.type === 'radio' ? true : !element.checked);
    return;
  }

  await control.trigger('click');
}

/** The accessible name a screen reader would announce, near enough for a test. */
export function accessibleName(element: Element): string {
  return (element.getAttribute('aria-label') ?? element.textContent ?? '').trim();
}

/**
 * Fails on anything axe rates serious or critical. Moderate and minor findings are left
 * out on purpose: they are worth fixing and not worth a red build on every theme.
 * @param element The mounted component
 */
export async function expectAccessible(element: Element): Promise<void> {
  const results = await axe.run(element, {
    // A component is not a page. Landmark and heading rules are about the page it will
    // be mounted into, and the playground is where they are checked.
    rules: { region: { enabled: false }, 'page-has-heading-one': { enabled: false } },
  });

  const serious = results.violations.filter(
    violation => violation.impact === 'serious' || violation.impact === 'critical',
  );

  expect(serious.map(violation => `${violation.id}: ${violation.help}`)).toEqual([]);
}
