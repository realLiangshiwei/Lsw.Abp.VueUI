import { enableAutoUnmount } from '@vue/test-utils';
import { afterEach, describe } from 'vitest';
import type { ThemeUnderTest } from './harness.js';
import {
  testButton,
  testFormField,
  testInput,
  testSpinner,
  testToggle,
} from './suites/controls.js';
import { testAccessibility } from './suites/accessibility.js';
import { testDatePicker, testSelect, testTypeahead } from './suites/choices.js';
import { testConfirmHost, testModal, testToastHost } from './suites/overlays.js';
import { testPagination } from './suites/pagination.js';

/**
 * The behaviour every theme owes the twelve contracts, as a suite the theme runs against
 * itself. Assertions are about what a user or a screen reader can tell -- roles, names,
 * focus, what is emitted -- never about markup, because two themes agreeing on markup
 * would mean the contract had failed at its job.
 * @param theme The theme under test and what it needs to be mounted
 */
export function runThemeContractTests(theme: ThemeUnderTest): void {
  describe(`the ${theme.name} theme`, () => {
    // Everything is mounted into the document, because focus and live regions do not
    // exist outside it. Left there, one test's markup is the next test's duplicate ids.
    enableAutoUnmount(afterEach);

    testButton(theme);
    testSpinner(theme);
    testFormField(theme);
    testInput(theme);
    testToggle(theme);
    testSelect(theme);
    testDatePicker(theme);
    testTypeahead(theme);
    testPagination(theme);
    testModal(theme);
    testToastHost(theme);
    testConfirmHost(theme);
    testAccessibility(theme);
  });
}
