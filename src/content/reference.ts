import { CHEATSHEET, type CheatSection } from './cheatsheet';
import { DECODER, decodeError, type DecoderEntry } from './decoder';
import { applyCheatsheetOverlay, applyDecoderOverlay, type CheatsheetOverlay, type DecoderOverlay } from './overlay';

/**
 * The reference pages (cheatsheet, error decoder) in a language. This module
 * and its translations are separate downloads, fetched when a page opens.
 */
const CHEATSHEET_FILES = import.meta.glob<{ CHEATSHEET: CheatsheetOverlay }>('./locales/*/cheatsheet.ts');
const DECODER_FILES = import.meta.glob<{ DECODER: DecoderOverlay }>('./locales/*/decoder.ts');

export async function cheatsheetIn(language: string): Promise<readonly CheatSection[]> {
  const file = CHEATSHEET_FILES[`./locales/${language}/cheatsheet.ts`];
  return applyCheatsheetOverlay(CHEATSHEET, file ? (await file()).CHEATSHEET : undefined);
}

export interface Decoder {
  entries: readonly DecoderEntry[];
  /** Finds the entry for a compiler message (matched on the English text), in the language. */
  decode: (text: string) => DecoderEntry | undefined;
}

export async function decoderIn(language: string): Promise<Decoder> {
  const file = DECODER_FILES[`./locales/${language}/decoder.ts`];
  const overlay = file ? (await file()).DECODER : undefined;
  const entries = DECODER.map((entry) => applyDecoderOverlay(entry, overlay));
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  return {
    entries,
    decode: (text) => {
      const found = decodeError(text);
      return found ? byId.get(found.id) : undefined;
    },
  };
}
