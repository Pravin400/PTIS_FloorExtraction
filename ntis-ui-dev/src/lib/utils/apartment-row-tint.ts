import type { CSSProperties } from 'react';

/**
 * The colour of the DATA of a row in the New Survey and the Existing Assessment (the text of the row; the background stays as it was),
 * by the TYPE of the unit; a unit without a type (null, blank, empty, "-") is coloured by its BHK.
 * Every different type has its own colour and every different BHK has its own colour; a type and a BHK never share one.
 *
 * The colours do NOT depend on the order the rows were loaded or sorted in, or on what was shown before: the colour of a type is
 * a fixed function of its text (a hash picks one of 72 colours), and when two types of the same screen pick the same hue the keys
 * are settled in alphabetical order, the next free hue is taken. So the same property shows the same colours when it is searched
 * again, after a refresh, and after a sort. There are 72 colours (24 curated hues in 3 shades): a screen with more than 72 different types / BHKs has to repeat.
 */

type TintSource = { id: string; type?: string | null; bhk?: string | null };

/**
 * 24 curated hues spaced across the color wheel strictly avoiding red (0°-25°, 335°-360°)
 * and green (50°-175°).
 * Adjacent slots are intentionally interleaved across contrasting color families (Purples,
 * Ambers, Blues, Magentas, Teals, Violets, Bronzes, Mulberries) so that consecutive types
 * receive distinct, high-contrast colors rather than similar shades.
 */
export const PALETTE_HUES: readonly number[] = [
  275,  // 0: Royal Purple
  182,  // 1: Dark Teal
  220,  // 2: Royal Blue (Type 1)
  42,   // 3: Golden Bronze
  268,  // 4: Electric Purple
  188,  // 5: Ocean Cyan
  295,  // 6: Rich Plum
  30,   // 7: Warm Orange / Amber (Type 6)
  242,  // 8: Deep Indigo
  318,  // 9: Vivid Magenta (Type 8)
  180,  // 10: Deep Turquoise
  36,   // 11: Warm Copper
  210,  // 12: Sky Blue
  280,  // 13: Royal Amethyst
  44,   // 14: Golden Ochre
  305,  // 15: Deep Mulberry
  184,  // 16: Cyan Teal
  226,  // 17: Classic Sapphire
  28,   // 18: Terracotta Amber
  260,  // 19: Midnight Violet
  326,  // 20: Bright Fuchsia
  192,  // 21: Steel Azure
  218,  // 22: Navy Cobalt
  38,   // 23: Cinnamon Gold
];

const HUES = PALETTE_HUES.length;
/** Three shades of every curated hue (saturation, lightness), all dark enough to be read as text on the white / light row. */
const SHADES: ReadonlyArray<readonly [number, number]> = [[70, 34], [80, 24], [65, 44]];
/** 24 hues x 3 shades: up to 72 different types / BHKs of one screen each have their own colour. */
const COLORS = HUES * SHADES.length;

const normalize = (text: string | null | undefined): string =>
  (text ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** What decides the colour of a unit: its type, else its BHK. `null` when it has neither. */
export function tintKeyOf(unit: Pick<TintSource, 'type' | 'bhk'>): string | null {
  const type = normalize(unit.type);
  if (type !== '' && type !== '-') return `type:${type}`;
  const bhk = normalize(unit.bhk);
  if (bhk !== '' && bhk !== '-') return `bhk:${bhk}`;
  return null;
}

/** A fixed number for a text (the same text, the same number, on every machine and in every session). */
function hashOf(text: string): number {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Colour number `slot` (0..71): the curated hues go first (so neighbours differ most), then the next shade of them. */
const colorOfSlot = (slot: number): string => {
  const [saturation, lightness] = SHADES[Math.floor(slot / HUES) % SHADES.length];
  return `hsl(${PALETTE_HUES[slot % HUES]}, ${saturation}%, ${lightness}%)`;
};

/**
 * The colour of each type / BHK key of the given keys. Keys are settled in alphabetical order, so the result is the same whatever
 * order the units came in.
 */
export function colorsForKeys(keys: Iterable<string>): Map<string, string> {
  const ordered = Array.from(new Set(keys)).sort();
  const taken = new Set<number>();
  const colors = new Map<string, string>();

  for (const key of ordered) {
    const preferred = hashOf(key) % COLORS;
    let slot = preferred;
    for (let tries = 0; tries < COLORS && taken.has(slot); tries++) {
      slot = (slot + 1) % COLORS;
    }
    // every colour taken (more than 72 keys): the preferred one is used again
    if (taken.has(slot)) slot = preferred;
    taken.add(slot);
    colors.set(key, colorOfSlot(slot));
  }
  return colors;
}

/** The colour of each unit by id; a unit without a type and without a BHK has none. */
export function buildRowTints(units: ReadonlyArray<TintSource>): Record<string, string> {
  const keyOf = new Map<string, string>();
  for (const unit of units) {
    const key = tintKeyOf(unit);
    if (key) keyOf.set(unit.id, key);
  }

  const colors = colorsForKeys(keyOf.values());
  const tints: Record<string, string> = {};
  keyOf.forEach((key, id) => {
    tints[id] = colors.get(key) as string;
  });
  return tints;
}

/** The colour goes to the row as a CSS variable (`--row-tint`); the row's cells take it as their text colour. */
export function rowTintStyle(color?: string): CSSProperties | undefined {
  return color ? ({ '--row-tint': color } as CSSProperties) : undefined;
}

/** The class that gives the text of every cell of the row the colour of `--row-tint`, semibold font, and 13px font size. */
export const ROW_TINT_TEXT_CLASS = '[&>td]:!text-[color:var(--row-tint)] [&>td]:!font-semibold [&>td]:text-[13px]';
