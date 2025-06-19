import { html_beautify } from 'js-beautify';

export const formatHtml = (html: string): string => {
  if (!html.trim()) return '';

  return html_beautify(html, {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: 1,
    preserve_newlines: true,
    wrap_line_length: 120,
    end_with_newline: false
  });
};