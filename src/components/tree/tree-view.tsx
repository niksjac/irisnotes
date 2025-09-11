import { useAtomValue } from "jotai";
import { itemsAtom } from "@/atoms/items";

export function TreeView() {
  const items = useAtomValue(itemsAtom);

  return (
    <div className="w-full h-full p-2">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Raw Items Data (JSON)
        </h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(items, null, 2)}
          </pre>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Total items: {items.length}</p>
          <p>Notes: {items.filter(item => item.type === 'note').length}</p>
          <p>Books: {items.filter(item => item.type === 'book').length}</p>
          <p>Sections: {items.filter(item => item.type === 'section').length}</p>
        </div>
      </div>
    </div>
  );
}