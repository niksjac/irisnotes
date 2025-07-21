import { forwardRef, useImperativeHandle } from 'react';
import clsx from 'clsx';
import { RichEditorProps } from './types';
import { editorSchema } from './schema';
import { useEditorView } from './hooks/use-editor-view';
import { useLineWrapping } from '../../hooks/use-line-wrapping';
import { RichEditorToolbar } from './rich-editor-toolbar';
import './prosemirror.css';

export interface RichEditorRef {
  focusAndPositionAtEnd: () => void;
}

export const RichEditor = forwardRef<RichEditorRef, RichEditorProps>(
  ({ content, onChange, readOnly = false, onToggleView, toolbarVisible = true }, ref) => {
    const { isWrapping } = useLineWrapping();
    const { editorRef, editorView, focusAndPositionAtEnd } = useEditorView({
      content,
      onChange,
      readOnly: readOnly || false,
      onToggleView: onToggleView || (() => {}),
      schema: editorSchema,
    });

    useImperativeHandle(
      ref,
      () => ({
        focusAndPositionAtEnd,
      }),
      [focusAndPositionAtEnd]
    );

    return (
      <div className='h-full flex flex-col overflow-hidden __1'>
        {toolbarVisible && <RichEditorToolbar editorView={editorView} schema={editorSchema} />}
        <div ref={editorRef} className={clsx('pt-2.5 pl-2.5 __2', isWrapping ? 'prose-wrap' : 'prose-nowrap')} />
      </div>
    );
  }
);
