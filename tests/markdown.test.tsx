import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown, markdownParts } from '../src/ui/Markdown';

describe('Markdown', () => {
  it('splits fenced code out of lesson text', () => {
    const parts = markdownParts('Before `x`.\n\n```ts\nif (a) {\n  return 1;\n}\n```\n\nAfter.');
    expect(parts.map((part) => part.kind)).toEqual(['text', 'code', 'text']);
    expect(parts[1]).toEqual({ kind: 'code', lang: 'ts', code: 'if (a) {\n  return 1;\n}' });
  });

  it('renders a fence as a code block with one element per line, not as inline code', () => {
    const { container } = render(<Markdown text={'Look:\n\n```ts\nconst a = 1;\nconst b = 2;\n```'} />);
    expect(container.querySelectorAll('.codeblock .codeblock__line')).toHaveLength(2);
    expect(container.querySelector('.prose__part code')).toBeNull();
    expect(container.textContent).toContain('const b = 2;');
  });

  it('keeps plain text as one block, and never renders raw HTML', () => {
    const { container } = render(<Markdown text={'Hi <b>there</b> and `code`'} />);
    expect(container.querySelector('.prose > p')).not.toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('code');
  });
});
