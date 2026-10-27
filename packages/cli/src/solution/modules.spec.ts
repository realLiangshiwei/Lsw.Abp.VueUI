import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readTemplateManifest } from '../template/manifest.js';
import { selectModules } from '../template/modules.js';
import { templateRoot } from '../template/paths.js';
import { readSolution } from './locate.js';
import { readModulePackages } from './modules.js';
import { writeSolutionFixture } from './solution-fixture.js';

describe('backend module selection', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'abpvue-modules-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });
  const manifest = readTemplateManifest(templateRoot());
  const selected = async () =>
    selectModules(await manifest, await readModulePackages(await readSolution(root)));

  it('selects the modules actually present in an OSS backend', async () => {
    await writeSolutionFixture(root);
    expect(await selected()).toEqual([
      'account',
      'identity',
      'tenant-management',
      'setting-management',
      'feature-management',
    ]);
  });

  it('ignores files beside the backend project directories', async () => {
    await writeSolutionFixture(root);
    await writeFile(join(root, 'src/Directory.Build.props'), '<Project />');
    expect(await selected()).toContain('identity');
  });

  it('selects commercial replacements without inventing absent optional modules', async () => {
    await writeSolutionFixture(root, {
      packages: [
        'Volo.Abp.Account.Pro.Public.Application',
        'Volo.Abp.Identity.Pro.Application',
        'Volo.Saas.Host.Application',
        'Volo.Abp.SettingManagement.Application',
        'Volo.Abp.Account.Pro.Admin.Application',
      ],
    });
    expect(await selected()).toEqual([
      'setting-management',
      'account-pro',
      'account-pro-admin',
      'identity-pro',
      'saas',
    ]);
  });

  it('recognizes HTTP and local project references while ignoring commented packages', async () => {
    await writeSolutionFixture(root, { packages: [] });
    await writeFile(
      join(root, 'src/Acme.BookStore.Application/Acme.BookStore.Application.csproj'),
      `<Project>
      <!-- <PackageReference Include="Volo.Abp.Gdpr.Application" /> -->
      <PackageReference Version="10.7.0" Include='Volo.Abp.Identity.Pro.HttpApi' />
      <ProjectReference Include="..\\..\\framework\\Volo.Abp.Account.Pro.Public.Application.csproj" />
      <ProjectReference Include="../../framework/Volo.Saas.Host.Application.csproj" />
    </Project>`,
    );
    expect(await selected()).toEqual(['account-pro', 'identity-pro', 'saas']);
  });

  it('allows explicit modules for customized backends', async () => {
    expect(selectModules(await manifest, new Set(), ['identity-pro'])).toEqual(['identity-pro']);
    expect(() => selectModules({ blocks: {} }, undefined, ['missing'])).toThrow('--modules has no');
  });

  it('keeps public and administrator account registration separate', async () => {
    const template = await manifest;
    expect(selectModules(template, new Set(['Volo.Abp.Account.Pro.Public.HttpApi']))).toEqual([
      'account-pro',
    ]);
    expect(() => selectModules(template, undefined, ['account-pro-admin'])).toThrow(
      'requires setting-management',
    );
  });

  it('prefers commercial replacements when a backend also references the basic packages', async () => {
    expect(
      selectModules(
        await manifest,
        new Set(['Volo.Abp.Identity.Application', 'Volo.Abp.Identity.Pro.Application']),
      ),
    ).toEqual(['identity-pro']);
  });
});
