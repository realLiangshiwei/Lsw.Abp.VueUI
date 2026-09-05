import { describe } from 'vitest';
import type { ThemeUnderTest } from './harness.js';
import {
  testButton,
  testFormField,
  testInput,
  testSpinner,
  testToggle,
} from './suites/controls.js';
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
    testButton(theme);
    testSpinner(theme);
    testFormField(theme);
    testInput(theme);
    testToggle(theme);
    testPagination(theme);
  });
}
