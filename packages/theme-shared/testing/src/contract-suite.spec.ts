import { plainTheme } from './plain-theme.js';
import { runThemeContractTests } from './run-theme-contract-tests.js';

// The suite run against an implementation built on nothing at all. If an assertion here
// starts failing for `theme-basic` alone, the assertion is about reka-ui rather than
// about the contract.
runThemeContractTests(plainTheme);
