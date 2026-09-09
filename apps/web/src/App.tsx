import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { CommandPalette } from './components/CommandPalette';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function App() {
  const [sidebarTab, setSidebarTab] = useState<'project' | 'git' | 'diagnostics' | 'history'>('project');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const ws = useWebSocket();

  useKeyboardShortcuts({
    'mod+k': () => setShowCommandPalette(true),
    'mod+b': () => setSidebarCollapsed(prev => !prev),
  });

  return (
    <div className="h-screen flex flex-col bg-devos-bg">
      <header className="h-12 flex items-center justify-between px-4 border-b border-devos-border bg-devos-surface shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="text-devos-accent">Dev</span>OS
          </h1>
          {projectPath && (
            <span className="text-sm text-devos-text-secondary font-mono">
              {projectPath.split(/[\\/]/).pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="text-xs text-devos-text-secondary hover:text-devos-text px-2 py-1 rounded border border-devos-border hover:border-devos-text-secondary"
          >
            ⌘K
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!sidebarCollapsed && (
          <Sidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            projectPath={projectPath}
            onProjectOpen={setProjectPath}
          />
        )}
        <ChatPanel
          projectPath={projectPath}
          wsEvents={ws.events}
          wsConnected={ws.connected}
        />
      </div>

      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onProjectOpen={setProjectPath}
        />
      )}
    </div>
  );
}
