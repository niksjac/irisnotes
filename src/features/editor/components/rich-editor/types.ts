export interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onToggleView?: () => void;
  toolbarVisible?: boolean;
}
