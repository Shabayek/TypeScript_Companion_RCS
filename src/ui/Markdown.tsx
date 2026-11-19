import MarkdownIt from 'markdown-it';
import { useMemo } from 'react';
import { CodeBlock } from './CodeBlock';
import type { CompilerFlags } from '../content/schema';
import { useTextLanguageProps } from '../content/contentLanguage';

/**
 * Lesson prose is Markdown, but raw HTML is disabled and links are disabled,
 * so rendered content can only ever be text plus the handful of inline tags
 * Markdown itself produces.
 */
const engine = new MarkdownIt({
  html: false,
  linkify: false,
  breaks: false,
  typographer: true,
}).disable('link');

type Part = { kind: 'text'; html: string } | { kind: 'code'; code: string; lang: string };

/** A fenced block on its own lines: ```ts … ``` */
const FENCE = /^```([\w-]*)[ \t]*\n([\s\S]*?)\n?^```[ \t]*$/gm;

/**
 * Splits out fenced code so it renders as a real code block (highlighted,
 * long lines wrapped with a hanging indent). Rendered by markdown-it, a fence
 * took the inline-code style, which never wraps: every code sample in a
 * reading step became one long line, and on a phone the whole lesson was
 * zoomed out to fit it.
 */
export function markdownParts(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(FENCE)) {
    const before = text.slice(last, match.index);
    if (before.trim()) parts.push({ kind: 'text', html: engine.render(before) });
    parts.push({ kind: 'code', lang: match[1] ?? '', code: match[2] ?? '' });
    last = (match.index ?? 0) + match[0].length;
  }
  const rest = text.slice(last);
  if (rest.trim() || parts.length === 0) parts.push({ kind: 'text', html: engine.render(rest) });
  return parts;
}

export function Markdown({
  text,
  className = 'prose',
  inspect = false,
  flags,
  ui = false,
}: {
  text: string;
  className?: string;
  /** Screen text (from the catalogue), not lesson text: always in the screen's language. */
  ui?: boolean;
  /** Code samples offer "See types" (lesson text). */
  inspect?: boolean;
  flags?: CompilerFlags;
}) {
  const parts = useMemo(() => markdownParts(text), [text]);
  const content = useTextLanguageProps();
  const language = ui ? {} : content;
  const only = parts.length === 1 ? parts[0] : undefined;
  if (only?.kind === 'text') {
    return <div className={className} {...language} dangerouslySetInnerHTML={{ __html: only.html }} />;
  }
  return (
    <div className={className} {...language}>
      {parts.map((part, index) =>
        part.kind === 'text' ? (
          <div key={index} className="prose__part" dangerouslySetInnerHTML={{ __html: part.html }} />
        ) : (
          <CodeBlock
            key={index}
            code={part.code}
            variant="light"
            copy={false}
            inspect={inspect && (part.lang === 'ts' || part.lang === 'typescript')}
            {...(flags ? { flags } : {})}
          />
        ),
      )}
    </div>
  );
}

/** Same engine, inline only: no wrapping paragraph, for labels and captions. */
export function InlineMarkdown({ text, className, ui = false }: { text: string; className?: string; ui?: boolean }) {
  const html = useMemo(() => engine.renderInline(text), [text]);
  const content = useTextLanguageProps();
  return <span className={className} {...(ui ? {} : content)} dangerouslySetInnerHTML={{ __html: html }} />;
}
