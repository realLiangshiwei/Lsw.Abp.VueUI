import type { FeatureGroupDto, IStringValueType } from '@lsw-abpvue/feature-management/proxy';
import { describe, expect, it } from 'vitest';
import type { EditableFeature } from '../models/feature.js';
import {
  changedFeatures,
  flattenFeatures,
  freeTextBounds,
  freeTextInputType,
  isFeatureDisabled,
  isOn,
  selectionItemKey,
  selectionItemsOf,
  setFeatureValue,
} from './features.js';

const toggle = { name: 'ToggleStringValueType', properties: {} };

/** Two groups: a three-level toggle chain, and one of each other value type. */
const GROUPS: FeatureGroupDto[] = [
  {
    name: 'Printing',
    displayName: 'Printing',
    features: [
      {
        name: 'Print',
        displayName: 'Print',
        value: 'false',
        depth: 0,
        valueType: toggle,
        provider: { name: 'D' },
      },
      {
        name: 'Print.Colour',
        displayName: 'In colour',
        value: 'false',
        depth: 1,
        parentName: 'Print',
        valueType: toggle,
        provider: { name: 'D' },
      },
      {
        name: 'Print.Colour.Duplex',
        displayName: 'Both sides',
        value: 'false',
        depth: 2,
        parentName: 'Print.Colour',
        valueType: toggle,
        provider: { name: 'D' },
      },
    ],
  },
  {
    name: 'Limits',
    displayName: 'Limits',
    features: [
      {
        name: 'Limits.MaxCopies',
        displayName: 'Maximum copies',
        value: '10',
        depth: 0,
        valueType: {
          name: 'FreeTextStringValueType',
          properties: {},
          validator: { name: 'NUMERIC', properties: { MinValue: 1, MaxValue: 100 } },
        },
        provider: { name: 'D' },
      },
      {
        name: 'Limits.PaperSize',
        displayName: 'Paper size',
        value: 'A4',
        depth: 0,
        valueType: {
          name: 'SelectionStringValueType',
          properties: {},
          itemSource: {
            items: [
              { value: 'A4', displayText: { resourceName: 'BookStore', name: 'Paper.A4' } },
              { value: 'Letter', displayText: { resourceName: 'BookStore', name: 'Paper.Letter' } },
            ],
          },
          // The concrete value type the API serializes; the contracts only say `IStringValueType`.
        } as IStringValueType,
        provider: { name: 'D' },
      },
    ],
  },
];

const flat = (): EditableFeature[] => flattenFeatures(GROUPS);
const valueOf = (features: readonly EditableFeature[], name: string): string | undefined =>
  features.find(feature => feature.name === name)?.value;

describe('flattenFeatures', () => {
  it('keeps the group each feature came from, and what it arrived as', () => {
    const features = flat();

    expect(features).toHaveLength(5);
    expect(features[0]?.groupName).toBe('Printing');
    expect(features[0]?.initialValue).toBe('false');
    expect(features[4]?.groupName).toBe('Limits');
  });
});

describe('setFeatureValue', () => {
  it('switches on every toggle above the one switched on', () => {
    const next = setFeatureValue(flat(), 'Print.Colour.Duplex', 'true');

    expect(valueOf(next, 'Print.Colour.Duplex')).toBe('true');
    expect(valueOf(next, 'Print.Colour')).toBe('true');
    expect(valueOf(next, 'Print')).toBe('true');
  });

  it('switches off every toggle below the one switched off', () => {
    const on = setFeatureValue(flat(), 'Print.Colour.Duplex', 'true');
    const off = setFeatureValue(on, 'Print', 'false');

    expect(valueOf(off, 'Print.Colour')).toBe('false');
    expect(valueOf(off, 'Print.Colour.Duplex')).toBe('false');
  });

  it('leaves the other groups alone', () => {
    const next = setFeatureValue(flat(), 'Print', 'true');

    expect(valueOf(next, 'Limits.MaxCopies')).toBe('10');
  });

  it('sets a free text value without cascading anything', () => {
    const next = setFeatureValue(flat(), 'Limits.MaxCopies', '25');

    expect(valueOf(next, 'Limits.MaxCopies')).toBe('25');
    expect(valueOf(next, 'Limits.PaperSize')).toBe('A4');
  });

  it('does not touch the list when nothing is named', () => {
    expect(setFeatureValue(flat(), 'Nothing', 'true')).toEqual(flat());
  });
});

describe('isOn', () => {
  it('reads anything but true as off', () => {
    const features = flat();

    expect(isOn(features[0] as EditableFeature)).toBe(false);
    expect(isOn({ ...(features[0] as EditableFeature), value: 'True' })).toBe(true);
    expect(isOn({ ...(features[0] as EditableFeature), value: '' })).toBe(false);
  });
});

describe('isFeatureDisabled', () => {
  it('lets a provider change what it or the default set', () => {
    const features = flat();

    expect(isFeatureDisabled(features, features[1] as EditableFeature, 'T')).toBe(false);
  });

  it('refuses what some other provider set', () => {
    const features = flat().map(feature =>
      feature.name === 'Print.Colour' ? { ...feature, provider: { name: 'E' } } : feature,
    );

    expect(isFeatureDisabled(features, features[1] as EditableFeature, 'T')).toBe(true);
  });

  it('freezes a root feature while a child of it belongs to someone else', () => {
    const features = flat().map(feature =>
      feature.name === 'Print.Colour' ? { ...feature, provider: { name: 'E' } } : feature,
    );

    // Switching the parent off would take a child no one here may change with it.
    expect(isFeatureDisabled(features, features[0] as EditableFeature, 'T')).toBe(true);
  });

  it('leaves a nested feature to its own provider', () => {
    const features = flat().map(feature =>
      feature.name === 'Print.Colour.Duplex' ? { ...feature, provider: { name: 'E' } } : feature,
    );

    expect(isFeatureDisabled(features, features[1] as EditableFeature, 'T')).toBe(false);
  });
});

describe('changedFeatures', () => {
  it('sends only what moved', () => {
    const next = setFeatureValue(flat(), 'Print.Colour', 'true');

    expect(changedFeatures(next)).toEqual([
      { name: 'Print', value: 'true' },
      { name: 'Print.Colour', value: 'true' },
    ]);
  });

  it('sends nothing when a value went back to where it started', () => {
    const there = setFeatureValue(flat(), 'Limits.MaxCopies', '25');
    const back = setFeatureValue(there, 'Limits.MaxCopies', '10');

    expect(changedFeatures(back)).toEqual([]);
  });
});

describe('the free text and selection details', () => {
  it('takes the box type and its bounds from the validator', () => {
    const features = flat();
    const maxCopies = features[3] as EditableFeature;

    expect(freeTextInputType(maxCopies)).toBe('number');
    expect(freeTextBounds(maxCopies)).toEqual({ min: 1, max: 100 });
    expect(freeTextInputType(features[0] as EditableFeature)).toBe('text');
    expect(freeTextBounds(features[0] as EditableFeature)).toEqual({});
  });

  it('reads the choices the concrete value type carries', () => {
    const features = flat();
    const items = selectionItemsOf(features[4] as EditableFeature);

    expect(items.map(item => item.value)).toEqual(['A4', 'Letter']);
    expect(selectionItemKey(items[0] as { value?: string })).toBe('BookStore::Paper.A4');
    expect(selectionItemsOf(features[0] as EditableFeature)).toEqual([]);
  });
});
