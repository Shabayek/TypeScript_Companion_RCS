// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from '../src/content/curriculum';
import { MODULE_LOADERS, __resetLoaderForTests, __setModuleLoaderForTests, loadLesson, loadModule, peekLesson } from '../src/content/loader';
import { LESSON_CATALOG } from '../src/content/generated/catalog';
import { FULL_COURSE } from '../src/content/fullCourse';
import { CATALOG_PATH, renderCatalog } from '../scripts/catalog';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('lesson catalog', () => {
  it('matches the lesson files (run `npm run content:catalog` after editing a lesson)', () => {
    expect(readFileSync(CATALOG_PATH, 'utf8')).toBe(renderCatalog());
  });

  it('describes every lesson in the course with its steps', () => {
    expect(LESSON_CATALOG.map((lesson) => lesson.id).sort()).toEqual(FULL_COURSE.map((lesson) => lesson.id).sort());
    for (const lesson of FULL_COURSE) {
      const meta = LESSON_CATALOG.find((item) => item.id === lesson.id);
      expect(meta?.steps).toEqual(
        lesson.steps.map((step) => ({
          id: step.id,
          kind: step.kind,
          ...(step.bonus ? { bonus: true } : {}),
          ...(step.runtime === 'modern' ? { modern: true } : {}),
        })),
      );
    }
  });
});

describe('loading lessons by module', () => {
  it('has a loader for exactly the course modules, each returning that module’s lessons', async () => {
    expect(Object.keys(MODULE_LOADERS).sort()).toEqual(MODULES.map((module) => module.id).sort());
    for (const module of MODULES) {
      const lessons = await loadModule(module.id, 'en');
      expect([...lessons.keys()].sort()).toEqual([...module.lessonIds].sort());
    }
  });

  it('keeps lesson content out of the main bundle: only the loader imports lesson files', () => {
    const root = join(__dirname, '..', 'src');
    const offenders = sourceFiles(root)
      .filter((file) => !file.endsWith(join('content', 'loader.ts')))
      .filter((file) => !file.includes(join('content', 'lessons')))
      .filter((file) => !file.endsWith(join('content', 'fullCourse.ts')))
      .filter((file) => /from\s+['"][./]*(content\/)?(lessons|fullCourse)(\/[^'"]*)?['"]/.test(readFileSync(file, 'utf8')))
      .map((file) => relative(root, file));
    expect(offenders).toEqual([]);
  });

  it('loads a lesson on demand and then serves it from memory', async () => {
    __resetLoaderForTests();
    const id = FULL_COURSE[0]!.id;
    expect(peekLesson(id, 'en')).toBeUndefined();
    const lesson = await loadLesson(id, 'en');
    expect(lesson?.id).toBe(id);
    expect(peekLesson(id, 'en')).toBe(lesson);
    expect(await loadLesson('no-such-lesson', 'en')).toBeUndefined();
  });

  it('forgets a failed download so the next attempt can succeed', async () => {
    __resetLoaderForTests();
    const module = MODULES[0]!;
    let calls = 0;
    __setModuleLoaderForTests(module.id, async () => {
      calls += 1;
      if (calls === 1) throw new Error('network down');
      return FULL_COURSE.filter((lesson) => lesson.moduleId === module.id);
    });
    await expect(loadModule(module.id, 'en')).rejects.toThrow('network down');
    const lessons = await loadModule(module.id, 'en');
    expect(lessons.size).toBe(module.lessonIds.length);
    __resetLoaderForTests();
  });
});
