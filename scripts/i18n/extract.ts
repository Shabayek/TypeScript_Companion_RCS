/**
 * `npm run i18n:extract -- <language>`: writes a worklist per content file to
 * translations/<language>/, one numbered English unit per line
 * (`@12 English text`), for a translator to replace with their language.
 * Existing translations follow their English text: when the English changes
 * or moves, run this again; unchanged texts keep their translation (under a
 * new number if need be), changed or new ones come back in English.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { allUnits, numbered, readWorklist } from './worklists';

const language = process.argv.slice(2).find((arg) => arg !== '--');
if (!language) throw new Error('Usage: npm run i18n:extract -- <language>');
const dir = join('translations', language);
mkdirSync(dir, { recursive: true });
for (const [name, units] of allUnits()) {
  const english = numbered(units);
  const file = join(dir, `${name}.txt`);
  // Previous translations, by the English line they translated.
  const before = readWorklist(join('translations', 'en', `${name}.txt`));
  const done = readWorklist(file);
  const byEnglish = new Map<string, string>();
  for (const [id, line] of before) {
    const translated = done.get(id);
    if (translated !== undefined) byEnglish.set(line, translated);
  }
  const source = english.map((item, index) => `@${index + 1} ${item.line}`).join('\n');
  mkdirSync(join('translations', 'en'), { recursive: true });
  writeFileSync(join('translations', 'en', `${name}.txt`), `${source}\n`);
  const lines = english.map((item, index) => `@${index + 1} ${byEnglish.get(item.line) ?? item.line}`);
  writeFileSync(file, `${lines.join('\n')}\n`);
}
console.log(`Worklists written to ${dir}`);
