import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_LESSONS, MODULES, moduleOfLesson } from '../../content/curriculum';
import { useJourney } from '../../storage/store';
import { Dialog } from '../../ui/Dialog';
import styles from './command.module.css';
import { useT } from '../../i18n/t';
import type { MessageKey } from '../../i18n/messages';
import { useCourse } from '../../content/useCourse';

interface Item {
  id: string;
  label: string;
  hint: string;
  to: string;
  group: 'Lesson' | 'Module' | 'Term' | 'Page';
}

const GROUP_LABEL: Record<Item['group'], MessageKey> = {
  Lesson: 'palette.groupLesson',
  Module: 'palette.groupModule',
  Term: 'palette.groupTerm',
  Page: 'palette.groupPage',
};

/** Pages, by message key: label `palette.<name>`, hint `palette.<name>Hint`. */
const PAGE_ROUTES = [
  ['journey', '/'],
  ['playground', '/playground'],
  ['practice', '/practice'],
  ['progress', '/progress'],
  ['glossary', '/glossary'],
  ['cheatsheet', '/cheatsheet'],
  ['decoder', '/decoder'],
  ['arena', '/arena'],
  ['settings', '/settings'],
  ['about', '/about'],
] as const;

/**
 * Cmd/Ctrl+K jumps to any lesson, term, or page. Deliberately dependency-free:
 * a filter over three local arrays, with keyboard navigation that mirrors a
 * native combobox (aria-activedescendant keeps focus in the input).
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const mode = useJourney((store) => store.state.settings.mode);
  const { t } = useT();
  const course = useCourse();
  const PAGES = useMemo<Item[]>(
    () =>
      PAGE_ROUTES.map(([name, to]) => ({
        id: `page-${name}`,
        label: t(`palette.${name}`),
        hint: t(`palette.${name}Hint`),
        to,
        group: 'Page',
      })),
    [t],
  );
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const moduleLabel = (number: number) =>
      number === 0 ? t('lesson.startHere') : t('lesson.moduleNumber', { number });
    const lessons: Item[] = ALL_LESSONS.map((lesson) => {
      const module = moduleOfLesson(lesson.id);
      return {
        id: `lesson-${lesson.id}`,
        label: course.lessonTitle(lesson, mode),
        hint: module ? `${moduleLabel(module.number)} · ${course.moduleTitle(module)}` : t('palette.groupLesson'),
        to: `/learn/${lesson.id}`,
        group: 'Lesson',
      };
    });

    const modules: Item[] = MODULES.map((module) => ({
      id: `module-${module.id}`,
      label: course.moduleTitle(module),
      hint: `${moduleLabel(module.number)} · ${course.moduleTagline(module)}`,
      to: `/module/${module.id}`,
      group: 'Module',
    }));

    const terms: Item[] = course.glossary.map((entry) => ({
      id: `term-${entry.id}`,
      label: entry.term,
      hint: entry.short,
      to: `/glossary?term=${entry.id}`,
      group: 'Term',
    }));

    return [...PAGES, ...modules, ...lessons, ...terms];
  }, [mode, PAGES, t, course]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [...PAGES, ...items.filter((item) => item.group === 'Lesson').slice(0, 6)];
    return items
      .filter(
        (item) =>
          item.label.toLowerCase().includes(needle) || item.hint.toLowerCase().includes(needle),
      )
      .slice(0, 40);
  }, [items, query, PAGES]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (active >= results.length) setActive(0);
  }, [results.length, active]);

  const choose = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    navigate(item.to);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => (results.length === 0 ? 0 : (current + 1) % results.length));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) =>
        results.length === 0 ? 0 : (current - 1 + results.length) % results.length,
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[active]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('palette.title')}>
      <div className={styles.wrap}>
        <label className="sr-only" htmlFor="palette-input">
          {t('palette.label')}
        </label>
        <input
          id="palette-input"
          ref={inputRef}
          className="input"
          type="search"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={t('palette.placeholder')}
          autoComplete="off"
          spellCheck={false}
        />

        {/* A listbox may only contain options: the <li> wrappers are
            presentational, and "no match" is a status message outside it. */}
        <ul id="palette-results" role="listbox" className={styles.list} aria-label={t('palette.results')}>
          {results.map((item, index) => (
            <li key={item.id} role="presentation">
              <button
                id={`palette-${item.id}`}
                type="button"
                role="option"
                aria-selected={index === active}
                className={styles.item}
                data-active={index === active}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
              >
                <bdi className={styles.label}>{item.label}</bdi>
                <span className={styles.hint}>{item.hint}</span>
                <span className={styles.group}>{t(GROUP_LABEL[item.group])}</span>
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 ? (
          <p className={styles.empty} role="status">
            {t('palette.noMatch')}
          </p>
        ) : null}

        <p className={styles.foot}>{t('palette.keys')}</p>
      </div>
    </Dialog>
  );
}
