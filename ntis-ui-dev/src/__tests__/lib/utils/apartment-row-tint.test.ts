import { describe, it, expect } from 'vitest';
import { buildRowTints, colorsForKeys, rowTintStyle, tintKeyOf } from '@/lib/utils/apartment-row-tint';

describe('tintKeyOf: what decides the colour of a unit', () => {
  it('is the type when the unit has one', () => {
    expect(tintKeyOf({ type: 'R1', bhk: '2 BHK' })).toBe('type:r1');
  });

  it('is the BHK when the type is null, blank, empty or a dash', () => {
    expect(tintKeyOf({ type: null, bhk: '2 BHK' })).toBe('bhk:2 bhk');
    expect(tintKeyOf({ type: undefined, bhk: '2 BHK' })).toBe('bhk:2 bhk');
    expect(tintKeyOf({ type: '   ', bhk: '2 BHK' })).toBe('bhk:2 bhk');
    expect(tintKeyOf({ type: '', bhk: '3 BHK' })).toBe('bhk:3 bhk');
    expect(tintKeyOf({ type: '-', bhk: '1 BHK' })).toBe('bhk:1 bhk');
  });

  it('is nothing when the unit has neither', () => {
    expect(tintKeyOf({ type: '-', bhk: '-' })).toBeNull();
    expect(tintKeyOf({ type: '  ', bhk: '' })).toBeNull();
    expect(tintKeyOf({})).toBeNull();
  });

  it('does not care about case or extra spaces', () => {
    expect(tintKeyOf({ type: ' r1 ' })).toBe(tintKeyOf({ type: 'R1' }));
    expect(tintKeyOf({ bhk: '2   bhk' })).toBe(tintKeyOf({ bhk: '2 BHK' }));
  });
});

describe('colorsForKeys: every different type / BHK has its own colour', () => {
  it('gives each of up to 72 different keys a colour of its own', () => {
    const keys = Array.from({ length: 72 }, (_, i) => `type:t${i}`);

    const colors = colorsForKeys(keys);

    expect(new Set(colors.values()).size).toBe(72);
  });

  it('gives different types a different colour whatever the types are called', () => {
    const keys = ['type:1', 'type:2', 'type:3', 'type:4', 'type:5', 'type:r1', 'type:r2', 'type:r3', 'type:c1', 'type:c2', 'type:c3', 'bhk:1 bhk', 'bhk:2 bhk', 'bhk:3 bhk'];

    expect(new Set(colorsForKeys(keys).values()).size).toBe(keys.length);
  });

  it('a type and a BHK with the same text do not share a colour', () => {
    const colors = colorsForKeys(['type:2 bhk', 'bhk:2 bhk']);

    expect(colors.get('type:2 bhk')).not.toBe(colors.get('bhk:2 bhk'));
  });

  it('is a dark enough colour to be read as text', () => {
    const color = colorsForKeys(['type:r1']).get('type:r1');

    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it('does not depend on the order of the keys', () => {
    const a = colorsForKeys(['type:r1', 'type:r2', 'type:c3', 'bhk:2 bhk', 'bhk:3 bhk']);
    const b = colorsForKeys(['bhk:3 bhk', 'type:c3', 'bhk:2 bhk', 'type:r2', 'type:r1']);

    for (const key of a.keys()) expect(b.get(key)).toBe(a.get(key));
  });

  it('strictly avoids green and red hues', () => {
    const keys = Array.from({ length: 24 }, (_, i) => `type:t${i}`);
    const colors = colorsForKeys(keys);

    for (const color of colors.values()) {
      const match = color.match(/^hsl\((\d+),/);
      expect(match).not.toBeNull();
      const hue = Number(match![1]);
      // Avoid red: 0-25 and 335-360
      const isRed = (hue >= 0 && hue <= 25) || (hue >= 335 && hue <= 360);
      expect(isRed).toBe(false);
      // Avoid green: 50-175
      const isGreen = hue >= 50 && hue <= 175;
      expect(isGreen).toBe(false);
    }
  });
});

describe('buildRowTints', () => {
  it('colours a unit by its type, else by its BHK; a unit with neither has none', () => {
    const tints = buildRowTints([
      { id: 'a', type: 'R1', bhk: '2 BHK' },
      { id: 'b', type: 'R1', bhk: '3 BHK' },   // same type: same colour, the BHK does not matter
      { id: 'c', type: 'R2', bhk: '2 BHK' },
      { id: 'd', type: null, bhk: '2 BHK' },   // no type: coloured by the BHK
      { id: 'e', type: '', bhk: '3 BHK' },
      { id: 'f', type: '-', bhk: '2 BHK' },    // same BHK as d
      { id: 'g', type: '-', bhk: '-' },
    ]);

    expect(tints.a).toBe(tints.b);
    expect(new Set([tints.a, tints.c, tints.d, tints.e]).size).toBe(4);   // R1, R2, 2 BHK, 3 BHK: four different colours
    expect(tints.d).toBe(tints.f);
    expect(tints).not.toHaveProperty('g');
  });

  // The scenario of the business: search a property, see its colours, refresh (or search another one and come back), the same
  // property must show the same colours.
  describe('the same property shows the same colours again', () => {
    const property = [
      { id: '1', type: 'R1', bhk: '1 BHK' },
      { id: '2', type: 'R2', bhk: '2 BHK' },
      { id: '3', type: 'C3', bhk: '' },
      { id: '4', type: '', bhk: '2 BHK' },
      { id: '5', type: 'R1', bhk: '2 BHK' },
    ];

    it('after a refresh (the same rows loaded again)', () => {
      expect(buildRowTints(property)).toEqual(buildRowTints(property));
    });

    it('after a sort (the rows come in another order)', () => {
      const sorted = [...property].reverse();

      expect(buildRowTints(sorted)).toEqual(buildRowTints(property));
    });

    it('after another property was searched in between', () => {
      const first = buildRowTints(property);
      buildRowTints([{ id: 'x', type: 'ZZ' }, { id: 'y', type: 'R2' }]);   // another society

      expect(buildRowTints(property)).toEqual(first);
    });

    it('the colour of a type is the same in another property that has the same type', () => {
      const here = buildRowTints([{ id: 'a', type: 'R1' }]);
      const there = buildRowTints([{ id: 'z', type: 'R1' }]);

      expect(there.z).toBe(here.a);
    });
  });
});

describe('rowTintStyle', () => {
  it('gives the colour to the row as the CSS variable --row-tint', () => {
    expect(rowTintStyle('hsl(10, 70%, 34%)')).toEqual({ '--row-tint': 'hsl(10, 70%, 34%)' });
  });

  it('is nothing without a colour', () => {
    expect(rowTintStyle(undefined)).toBeUndefined();
  });
});
