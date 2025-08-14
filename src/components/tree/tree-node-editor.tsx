import { useState, useRef, useEffect } from "react";

interface TreeNodeEditorProps {
  initialValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function TreeNodeEditor({ initialValue, onSubmit, onCancel }: TreeNodeEditorProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && trimmedValue !== initialValue) {
      onSubmit(trimmedValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        event.stopPropagation();
        handleSubmit();
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        break;
    }
  };

  const handleBlur = () => {
    handleSubmit();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      data-tree-editing="true"
      className="flex-1 px-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-blue-500 rounded outline-none"
    />
  );
}
