interface SidebarSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

export function SidebarSearch({ searchQuery, onSearchChange, placeholder = 'Search notes...' }: SidebarSearchProps) {
  return (
    <div className='w-full'>
      <input
        type='text'
        placeholder={placeholder}
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      />
    </div>
  );
}
