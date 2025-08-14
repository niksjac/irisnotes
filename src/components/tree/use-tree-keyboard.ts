import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";

interface UseTreeKeyboardOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onNodeSelect: (nodeId: string) => void;
  onNodeActivate: (nodeId: string) => void;
  onNodeEdit: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
}

export function useTreeKeyboard(options: UseTreeKeyboardOptions) {
  const { containerRef, onNodeSelect, onNodeActivate, onNodeEdit, onNodeToggle } = options;

  useHotkeys(
    "f2",
    () => {
      const container = containerRef.current;
      if (container) {
        const focusedElement = container.querySelector('[data-tree-focused="true"]');
        if (focusedElement) {
          const nodeId = focusedElement.getAttribute('data-node-id');
          if (nodeId) {
            onNodeEdit(nodeId);
          }
        }
      }
    },
    {
      preventDefault: true,
      enableOnContentEditable: false,
      enableOnFormTags: false,
    }
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const container = containerRef.current;
      if (!container || !container.contains(event.target as Node)) {
        return;
      }

      if (container.querySelector('[data-tree-editing="true"]')) {
        return;
      }

      const focusedElement = container.querySelector('[data-tree-focused="true"]');
      if (!focusedElement) return;

      const nodeId = focusedElement.getAttribute('data-node-id');
      if (!nodeId) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          navigateToNext(container, focusedElement);
          break;

        case 'ArrowUp':
          event.preventDefault();
          navigateToPrevious(container, focusedElement);
          break;

        case 'ArrowRight':
          event.preventDefault();
          const isExpanded = focusedElement.getAttribute('data-tree-expanded') === 'true';
          const hasChildren = focusedElement.getAttribute('data-tree-has-children') === 'true';

          if (hasChildren) {
            if (!isExpanded) {
              onNodeToggle(nodeId);
            } else {
              navigateToNext(container, focusedElement);
            }
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          const expanded = focusedElement.getAttribute('data-tree-expanded') === 'true';
          const children = focusedElement.getAttribute('data-tree-has-children') === 'true';

          if (children && expanded) {
            onNodeToggle(nodeId);
          } else {
            const parentElement = findParentNode(container, focusedElement);
            if (parentElement) {
              const parentId = parentElement.getAttribute('data-node-id');
              if (parentId) {
                focusNode(parentElement);
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (event.key === 'Enter') {
            onNodeActivate(nodeId);
          } else {
            onNodeToggle(nodeId);
          }
          break;

        case 'Home':
          event.preventDefault();
          const firstNode = container.querySelector('[data-tree-node]');
          if (firstNode) {
            focusNode(firstNode as HTMLElement);
          }
          break;

        case 'End':
          event.preventDefault();
          const allNodes = container.querySelectorAll('[data-tree-node]');
          const lastNode = allNodes[allNodes.length - 1];
          if (lastNode) {
            focusNode(lastNode as HTMLElement);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, onNodeSelect, onNodeActivate, onNodeEdit, onNodeToggle]);

  const navigateToNext = (container: HTMLDivElement, currentElement: Element) => {
    const allNodes = Array.from(container.querySelectorAll('[data-tree-node]'));
    const currentIndex = allNodes.indexOf(currentElement);
    const nextNode = allNodes[currentIndex + 1];
    if (nextNode) {
      focusNode(nextNode as HTMLElement);
    }
  };

  const navigateToPrevious = (container: HTMLDivElement, currentElement: Element) => {
    const allNodes = Array.from(container.querySelectorAll('[data-tree-node]'));
    const currentIndex = allNodes.indexOf(currentElement);
    const prevNode = allNodes[currentIndex - 1];
    if (prevNode) {
      focusNode(prevNode as HTMLElement);
    }
  };

  const findParentNode = (container: HTMLDivElement, currentElement: Element) => {
    const currentLevel = parseInt(currentElement.getAttribute('data-tree-level') || '0');
    const allNodes = Array.from(container.querySelectorAll('[data-tree-node]'));
    const currentIndex = allNodes.indexOf(currentElement);

    for (let i = currentIndex - 1; i >= 0; i--) {
      const node = allNodes[i];
      if (node) {
        const nodeLevel = parseInt(node.getAttribute('data-tree-level') || '0');
        if (nodeLevel === currentLevel - 1) {
          return node as HTMLElement;
        }
      }
    }
    return null;
  };

  const focusNode = (element: HTMLElement) => {
    containerRef.current?.querySelectorAll('[data-tree-focused="true"]').forEach(el => {
      el.setAttribute('data-tree-focused', 'false');
    });

    element.setAttribute('data-tree-focused', 'true');
    element.focus();

    const nodeId = element.getAttribute('data-node-id');
    if (nodeId) {
      onNodeSelect(nodeId);
    }
  };
}
