/**
 * Writes src/content/generated/catalog.ts from the lesson files.
 *
 *   npm run content:catalog
 *
 * Run it after adding or changing a lesson.
 */
import { writeFileSync } from 'node:fs';
import { LESSONS } from '../src/content/lessons';
import { CATALOG_PATH, renderCatalog } from './catalog';

writeFileSync(CATALOG_PATH, renderCatalog());
console.log(`content:catalog — wrote ${LESSONS.length} lessons to src/content/generated/catalog.ts`);
