import { Tree } from 'antd';
import { useItems, useTabManagement } from '../../../hooks';
import { adaptFlexibleItemsToAntdTree, type AntdTreeItemData } from './antd-tree-adapter';
import { FileText, BookOpen, Folder } from 'lucide-react';
import { useState } from 'react';

export function AntdTreeView() {
  const { items, selectedItem, selectItem, moveItem } = useItems();
  const { openNoteInTab, openTreeViewInTab } = useTabManagement();
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const treeData = adaptFlexibleItemsToAntdTree(items);

  // Auto-expand book and section nodes initially
  const getInitialExpandedKeys = () => {
    return items
      .filter(item => item.type !== 'note')
      .map(item => item.id);
  };

  const handleSelect = (selectedKeys: React.Key[]) => {
    const selectedId = selectedKeys[0] as string;
    if (selectedId) {
      selectItem(selectedId);
    }
  };

  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys as string[]);
  };

  const handleDoubleClick = (_e: React.MouseEvent, node: any) => {
    const item = items.find(i => i.id === node.key);
    if (item) {
      if (item.type === 'note') {
        openNoteInTab(item);
      } else {
        openTreeViewInTab(item, items);
      }
    }
  };

  const getItemIcon = (type: 'book' | 'section' | 'note') => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'section':
        return <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const titleRender = (nodeData: AntdTreeItemData) => (
    <div
      className="flex items-center gap-2"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({
          id: nodeData.key,
          type: nodeData.type,
          title: nodeData.title
        }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(e) => {
        if (nodeData.type !== 'note') {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={async (e) => {
        if (nodeData.type === 'note') return;

        e.preventDefault();
        try {
          const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (dragData.id !== nodeData.key) {
            await moveItem(dragData.id, nodeData.key as string);
          }
        } catch (error) {
          console.error('Error handling drop:', error);
        }
      }}
    >
      {getItemIcon(nodeData.type)}
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{nodeData.title}</span>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="w-full h-full overflow-auto p-2">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>No items found</p>
          <p className="text-sm">Create a book to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-2 select-none">
      <Tree
        treeData={treeData}
        onSelect={handleSelect}
        onExpand={handleExpand}
        onDoubleClick={handleDoubleClick}
        selectedKeys={selectedItem ? [selectedItem.id] : []}
        expandedKeys={expandedKeys.length > 0 ? expandedKeys : getInitialExpandedKeys()}
        titleRender={titleRender}
        showLine={false}
        blockNode
        style={{
          background: 'transparent',
          color: 'rgb(17 24 39)',
        }}
        className="antd-tree-custom"
      />
            <style>{`
        .antd-tree-custom .ant-tree-node-content-wrapper {
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
          color: inherit;
          user-select: none;
        }

        .antd-tree-custom .ant-tree-node-content-wrapper:hover {
          background-color: var(--tree-hover-bg);
        }

        .antd-tree-custom .ant-tree-node-content-wrapper.ant-tree-node-selected {
          background-color: var(--tree-selected-bg);
        }

        .antd-tree-custom .ant-tree-node-content-wrapper.ant-tree-node-selected:hover {
          background-color: var(--tree-selected-hover-bg);
        }

                .antd-tree-custom .ant-tree-switcher {
          color: rgb(75 85 99) !important;
        }

        .antd-tree-custom .ant-tree-switcher-icon {
          color: rgb(75 85 99) !important;
        }

        .antd-tree-custom .ant-tree-title {
          color: rgb(17 24 39);
        }

        .antd-tree-custom .ant-tree-iconEle {
          color: rgb(75 85 99);
        }

        .antd-tree-custom {
          color: rgb(17 24 39);
          background: transparent;
        }

        @media (prefers-color-scheme: dark) {
          .antd-tree-custom {
            color: rgb(243 244 246);
          }

          .antd-tree-custom .ant-tree-title {
            color: rgb(243 244 246);
          }

          .antd-tree-custom .ant-tree-switcher {
            color: rgb(156 163 175) !important;
          }

          .antd-tree-custom .ant-tree-switcher-icon {
            color: rgb(156 163 175) !important;
          }

          .antd-tree-custom .ant-tree-iconEle {
            color: rgb(156 163 175);
          }
        }


      `}</style>
    </div>
  );
}
