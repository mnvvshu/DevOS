import { useState, useRef, useEffect } from 'react';
import { Search, FolderOpen, Moon } from 'lucide-react';

interface CommandPaletteProps {
  onClose: () => void;
  onProjectOpen: (path: string) => void;
}

interface Command {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  action: () => void;
  category: string;
}

export function CommandPalette({ onClose, onProjectOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: 'open-project',
      label: 'Open Project',
      icon: FolderOpen,
      action: () => {
        const path = prompt('Enter project path:');
        if (path) onProjectOpen(path);
        onClose();
      },
      category: 'Project',
    },
    {
      id: 'toggle-theme',
      label: 'Toggle Dark/Light Mode',
      icon: Moon,
      action: () => {
        document.documentElement.classList.toggle('dark');
        onClose();
      },
      category: 'Appearance',
    },
  ];

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50" onClick={onClose}>
      <div
        className="bg-devos-surface border border-devos-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-devos-border">
          <Search size={18} className="text-devos-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-devos-text-secondary"
          />
          <kbd className="text-xs text-devos-text-secondary bg-devos-bg px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={cmd.action}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                i === selectedIndex ? 'bg-devos-accent/10 text-devos-accent' : 'hover:bg-devos-surface-hover'
              }`}
            >
              <cmd.icon size={16} />
              <span>{cmd.label}</span>
              <span className="ml-auto text-xs text-devos-text-secondary">{cmd.category}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-devos-text-secondary">No commands found</div>
          )}
        </div>
      </div>
    </div>
  );
}
