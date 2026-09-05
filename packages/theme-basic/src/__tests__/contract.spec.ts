import { runThemeContractTests } from '@lsw-abpvue/theme-shared/testing';
import { provideAbpThemeBasic } from '../providers/theme-basic.provider.js';

runThemeContractTests({
  name: 'basic',
  providers: [provideAbpThemeBasic()],
});
