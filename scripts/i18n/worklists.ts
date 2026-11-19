/**
 * The worklists: one numbered English unit per line (`@12 English text`),
 * per content file (course, glossary, cheatsheet, decoder, m00…m19).
 */
import { existsSync, readFileSync } from 'node:fs';
import { LESSONS } from '../../src/content/lessons';
import { MODULES } from '../../src/content/curriculum';
import { GLOSSARY } from '../../src/content/glossary';
import { CHEATSHEET } from '../../src/content/cheatsheet';
import { DECODER } from '../../src/content/decoder';
import { encode, lessonUnits, type Unit } from './units';

export function courseUnits(): Unit[] {
  const out: Unit[] = [];
  for (const module of MODULES) {
    out.push({ path: ['modules', module.id, 'title'], text: module.title });
    out.push({ path: ['modules', module.id, 'tagline'], text: module.tagline });
  }
  for (const lesson of LESSONS) {
    for (const mode of ['story', 'explorer', 'pro'] as const) {
      out.push({ path: ['lessons', lesson.id, 'title', mode], text: lesson.title[mode] });
    }
  }
  return out;
}

export function glossaryUnits(): Unit[] {
  return GLOSSARY.flatMap((entry) => [
    { path: [entry.id, 'term'], text: entry.term },
    { path: [entry.id, 'short'], text: entry.short },
    { path: [entry.id, 'detail'], text: entry.detail },
  ]);
}

export function cheatsheetUnits(): Unit[] {
  return CHEATSHEET.flatMap((section) => [
    { path: [section.id, 'title'], text: section.title },
    ...section.entries.flatMap((entry, index) => [
      { path: [section.id, 'entries', index, 'title'], text: entry.title },
      ...(entry.note ? [{ path: [section.id, 'entries', index, 'note'], text: entry.note }] : []),
    ]),
  ]);
}

export function decoderUnits(): Unit[] {
  return DECODER.flatMap((entry) => [
    { path: [entry.id, 'title'], text: entry.title },
    { path: [entry.id, 'plain'], text: entry.plain },
    { path: [entry.id, 'fix'], text: entry.fix },
  ]);
}

/** Every content file and its units, by worklist name. */
export function allUnits(): Map<string, Unit[]> {
  const files = new Map<string, Unit[]>();
  files.set('course', courseUnits());
  files.set('glossary', glossaryUnits());
  files.set('cheatsheet', cheatsheetUnits());
  files.set('decoder', decoderUnits());
  for (const module of MODULES) {
    files.set(module.id, lessonUnits(LESSONS.filter((lesson) => lesson.moduleId === module.id)));
  }
  return files;
}

/** Distinct texts in a file, numbered in order of first appearance. */
export function numbered(units: readonly Unit[]): { text: string; line: string }[] {
  const seen = new Map<string, string>();
  for (const unit of units) if (!seen.has(unit.text)) seen.set(unit.text, encode(unit.text).line);
  return [...seen.entries()].map(([text, line]) => ({ text, line }));
}

export function readWorklist(path: string): Map<number, string> {
  const lines = new Map<number, string>();
  if (!existsSync(path)) return lines;
  for (const raw of readFileSync(path, 'utf8').split('\n')) {
    const match = /^@(\d+) (.*)$/.exec(raw);
    if (match) lines.set(Number(match[1]), match[2] ?? '');
  }
  return lines;
}

