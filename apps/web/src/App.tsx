import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { CommandPalette } from './components/CommandPalette';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { ProviderPanel } from './components/ProviderPanel';
import { FileViewer } from './components/FileViewer';
import { useWebSocket } from './hooks/useWebSocket';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export function App() {
  const [sidebarTab, setSidebarTab] = useState<'project' | 'git' | 'diagnostics' | 'history'>('project');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('gemini');
  const [dirHandle, setDirHandle] = useState<any>(null); // Browser File System Access API handle
  const ws = useWebSocket();

  useKeyboardShortcuts({
    'mod+k': () => setShowCommandPalette(true),
    'mod+b': () => setSidebarCollapsed(prev => !prev),
    'Escape': () => setActiveFile(null),
  });

  const handleFileClick = (filePath: string) => {
    setActiveFile(filePath);
  };

  const handleProjectOpen = (path: string) => {
    setProjectPath(path);
    setActiveFile(null);
    // If the project is closed, also clear the dirHandle
    if (!path) setDirHandle(null);
  };

  return (
    <div className="h-screen flex flex-col bg-devos-bg">
      <header className="h-12 flex items-center justify-between px-4 border-b border-devos-border bg-devos-surface shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="DevOS" className="w-6 h-6 rounded-md object-contain shadow-sm" />
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="text-devos-accent">Dev</span>OS
          </h1>
          {projectPath && (
            <span className="text-sm text-devos-text-secondary font-mono">
              {projectPath.split(/[/\\]/).pop()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Active provider badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-devos-bg border border-devos-border text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-devos-success animate-pulse" />
            <span className="text-devos-text-secondary capitalize">{activeProvider}</span>
          </div>
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
            onProjectOpen={handleProjectOpen}
            onFileClick={handleFileClick}
            onDirHandle={setDirHandle}
          />
        )}

        {/* Main content area */}
        {sidebarTab === 'diagnostics' ? (
          <SystemDiagnostics />
        ) : activeFile && projectPath ? (
          // Show file viewer when a file is clicked
          <FileViewer
            projectPath={projectPath}
            filePath={activeFile}
            dirHandle={dirHandle}
            onClose={() => setActiveFile(null)}
          />
        ) : (
          <ChatPanel
            projectPath={projectPath}
            wsEvents={ws.events}
            wsConnected={ws.connected}
          />
        )}
      </div>

      {/* Provider Panel (right side) */}
      <ProviderPanel onProviderChange={setActiveProvider} />

      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onProjectOpen={handleProjectOpen}
        />
      )}
    </div>
  );
}
