import {
  ABP_INJECTOR_KEY,
  createInjector,
  type Injector,
  type ProviderInput,
} from '@lsw-abpvue/core';
import { mount, type VueWrapper } from '@vue/test-utils';
import axe from 'axe-core';
import { expect } from 'vitest';
import type { Component } from 'vue';

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
    global: { provide: { [ABP_INJECTOR_KEY]: injector } },
  });

  return { wrapper, injector, emitted: event => recorded.get(event) ?? [] };
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
  const { wrapper } = rendered;
  const native = wrapper.find('select');

  if (native.exists()) {
    await native.setValue(option.value);
    return;
  }

  await openOverlay(theme, wrapper);
  const item = wrapper.findAll('[role="option"]').find(entry => entry.text() === option.label);
  await item?.trigger('click');
}

/** Opens an overlay control the way its ARIA pattern says it opens. */
export async function openOverlay(theme: ThemeUnderTest, wrapper: VueWrapper): Promise<void> {
  if (theme.open) {
    await theme.open(wrapper);
    return;
  }

  await wrapper.find('[aria-expanded]').trigger('click');
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
