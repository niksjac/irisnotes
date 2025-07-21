import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';

// URL input rule
export const createUrlInputRule = (schema: Schema) =>
  new InputRule(/(?:^|\s)((?:https?:\/\/|www\.)[^\s]+)(\s|\n|$)/, (state, match, start, end) => {
    const url = match[1];
    if (!url || !schema.marks.link) return null;

    const href = url.startsWith('www.') ? `https://${url}` : url;
    const linkMark = schema.marks.link.create({ href });
    const textNode = schema.text(url, [linkMark]);
    const tr = state.tr.replaceWith(start + match[0].indexOf(url), end - (match[2] ? 1 : 0), textNode);
    return tr;
  });
