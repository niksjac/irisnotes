import { DOMParser, DOMSerializer, Schema } from 'prosemirror-model';

export function parseHtmlContent(content: string, schema: Schema) {
  if (!content || !content.trim()) {
    return schema.nodes.doc.create(schema.nodes.paragraph.create());
  }

  try {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    return DOMParser.fromSchema(schema).parse(tempDiv);
  } catch (error) {
    console.warn('Failed to parse content, using empty document:', error);
    return schema.nodes.doc.create(schema.nodes.paragraph.create());
  }
}

export function serializeToHtml(doc: any, schema: Schema): string {
  try {
    const serializer = DOMSerializer.fromSchema(schema);
    const fragment = serializer.serializeFragment(doc.content);
    const div = document.createElement('div');
    div.appendChild(fragment);
    return div.innerHTML;
  } catch (error) {
    console.warn('Failed to serialize content:', error);
    return '';
  }
}