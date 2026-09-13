import { describe, expect, it } from 'vitest';
import { ImportCollector, moduleSpecifier } from './imports.js';

describe('moduleSpecifier', () => {
  it('carries the extension, so node16 resolution finds the file too', () => {
    expect(moduleSpecifier('Volo.Abp.Identity', 'Volo.Abp.Identity', 'models')).toBe('./models.js');
    expect(moduleSpecifier('Volo.Abp.Identity', 'Volo.Abp.Users', 'models')).toBe(
      '../users/models.js',
    );
  });
});

describe('the imports of one file', () => {
  it('keeps a value import and a type import apart', () => {
    const imports = new ImportCollector();
    imports.addValue('@lsw-abpvue/core', 'RestService');
    imports.addType('@lsw-abpvue/core', 'RestConfig');
    imports.addType('./models.js', 'BookDto');

    expect(imports.render()).toBe(
      [
        "import { RestService } from '@lsw-abpvue/core';",
        "import type { RestConfig } from '@lsw-abpvue/core';",
        "import type { BookDto } from './models.js';",
      ].join('\n'),
    );
  });

  it('does not import a name twice when it is used both ways', () => {
    const imports = new ImportCollector();
    imports.addValue('./x.enum.js', 'BookType');
    imports.addType('./x.enum.js', 'BookType');

    expect(imports.render()).toBe("import { BookType } from './x.enum.js';");
  });
});
