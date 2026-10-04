import { withLocalizations } from '@lsw-abpvue/core';

export const catalogueTexts = withLocalizations([
  {
    culture: 'en',
    resources: [
      { resourceName: 'BookStore', texts: { Catalogue: 'Catalogue', ResultCount: '{0} books' } },
    ],
  },
  {
    culture: 'zh-Hans',
    resources: [
      { resourceName: 'BookStore', texts: { Catalogue: '图书目录', ResultCount: '共 {0} 本书' } },
    ],
  },
]);
