import type { CheatSection } from '../../content/cheatsheet';
import type { Decoder } from '../../content/reference';

/*
 * One loader per language, kept, so `useLazyData` (which caches by loader)
 * downloads each language once and switches instantly when it comes back.
 */
const cheatsheets = new Map<string, () => Promise<readonly CheatSection[]>>();
const decoders = new Map<string, () => Promise<Decoder>>();

export function cheatsheetLoader(language: string): () => Promise<readonly CheatSection[]> {
  let load = cheatsheets.get(language);
  if (!load) {
    load = () => import('../../content/reference').then((module) => module.cheatsheetIn(language));
    cheatsheets.set(language, load);
  }
  return load;
}

export function decoderLoader(language: string): () => Promise<Decoder> {
  let load = decoders.get(language);
  if (!load) {
    load = () => import('../../content/reference').then((module) => module.decoderIn(language));
    decoders.set(language, load);
  }
  return load;
}
