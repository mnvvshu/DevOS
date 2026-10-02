import { useState, useEffect } from 'react';
import {
  FolderOpen, GitBranch, Activity, Clock,
  RefreshCw,
} from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface SidebarProps {
  activeTab: 'project' | 'git' | 'diagnostics' | 'history';
  onTabChange: (tab: 'project' | 'git' | 'diagnostics' | 'history') => void;
  projectPath: string | null;
  onProjectOpen: (path: string) => void;
  onFileClick?: (filePath: string) => void;
  onDirHandle?: (handle: any) => void;
}

const TABS = [
  { id: 'project' as const, icon: FolderOpen, label: 'Project' },
  { id: 'git' as const, icon: GitBranch, label: 'Git' },
  { id: 'diagnostics' as const, icon: Activity, label: 'System' },
  { id: 'history' as const, icon: Clock, label: 'History' },
];

export function Sidebar({ activeTab, onTabChange, projectPath, onProjectOpen, onFileClick, onDirHandle }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-devos-border flex shrink-0">
      {/* Tab strip */}
      <div className="w-12 bg-devos-surface border-r border-devos-border flex flex-col items-center py-2 gap-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-devos-accent/10 text-devos-accent'
                : 'text-devos-text-secondary hover:text-devos-text hover:bg-devos-surface-hover'
            }`}
            title={tab.label}
          >
            <tab.icon size={20} />
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'project' && (
          <ProjectPanel projectPath={projectPath} onProjectOpen={onProjectOpen} onFileClick={onFileClick} onDirHandle={onDirHandle} />
        )}
        {activeTab === 'git' && (
          <GitPanel projectPath={projectPath} />
        )}
        {activeTab === 'diagnostics' && (
          <DiagnosticsPanel />
        )}
        {activeTab === 'history' && (
          <HistoryPanel />
        )}
      </div>
    </aside>
  );
}

function ProjectPanel({ projectPath, onProjectOpen, onFileClick, onDirHandle }: { projectPath: string | null; onProjectOpen: (p: string) => void; onFileClick?: (filePath: string) => void; onDirHandle?: (handle: any) => void }) {
  const [inputPath, setInputPath] = useState('');
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  // Fetch file tree from server when project path changes
  useEffect(() => {
    if (projectPath && projectPath.includes('/') || projectPath && projectPath.includes('\\')) {
      // It's a real filesystem path — fetch from server
      api.getProjectFiles(projectPath)
        .then(result => {
          const tree = buildFileTree(result.files);
          setFileTree(tree);
        })
        .catch(err => console.error('Failed to fetch project files:', err));
    }
  }, [projectPath]);

  const handleOpen = async () => {
    if (!inputPath.trim()) return;
    setLoading(true);
    try {
      const result = await api.analyzeProject(inputPath.trim());
      setProjectInfo(result);
      onProjectOpen(inputPath.trim());
    } catch (err) {
      console.error('Failed to analyze project:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open folder picker using File System Access API
  const handlePickFolder = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const name = dirHandle.name;
      setLoading(true);

      // Store the dirHandle for file reading
      onDirHandle?.(dirHandle);

      // Read directory recursively (browser-side)
      const tree = await readDirectoryRecursive(dirHandle);
      setFileTree(tree);
      onProjectOpen(name);
      setLoading(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Folder picker error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-devos-text-secondary uppercase tracking-wider mb-3">Project</h3>

      {!projectPath ? (
        <div className="space-y-2">
          <input
            type="text"
            value={inputPath}
            onChange={e => setInputPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpen()}
            placeholder="Enter project path..."
            className="w-full px-3 py-2 text-sm bg-devos-bg border border-devos-border rounded-lg focus:outline-none focus:border-devos-accent"
          />
          <button
            onClick={handleOpen}
            disabled={loading || !inputPath.trim()}
            className="w-full px-3 py-2 text-sm bg-devos-accent text-white rounded-lg hover:bg-devos-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? 'Analyzing...' : 'Create Project'}
          </button>
          <button
            onClick={handlePickFolder}
            disabled={loading}
            className="w-full px-3 py-2 text-sm border border-devos-border text-devos-text-secondary rounded-lg hover:bg-devos-surface-hover hover:text-devos-text disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <FolderOpen size={14} />
            Open Folder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{projectPath.split(/[/\\]/).pop()}</div>
            <button
              onClick={() => { onProjectOpen(''); setProjectInfo(null); setFileTree([]); }}
              className="text-xs text-devos-text-secondary hover:text-devos-text"
            >
              Close
            </button>
          </div>
          {projectInfo?.project && (
            <div className="space-y-1 text-xs text-devos-text-secondary">
              {projectInfo.project.languages?.length > 0 && <div>{projectInfo.project.languages.join(', ')}</div>}
              {projectInfo.index && <div>{projectInfo.index.totalFiles} files</div>}
            </div>
          )}
          {fileTree.length > 0 && (
            <div className="border-t border-devos-border pt-2">
              <div className="text-xs text-devos-text-secondary mb-1 uppercase tracking-wider font-semibold">Files</div>
              <div className="space-y-0 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {fileTree.map((node, i) => (
                  <FileTreeNode key={i} node={node} depth={0} parentPath="" onFileClick={onFileClick} />
                ))}
              </div>
            </div>
          )}
          {fileTree.length === 0 && loading && (
            <div className="text-xs text-devos-text-secondary animate-pulse">Loading files...</div>
          )}
        </div>
      )}
    </div>
  );
}

interface FileNode {
  name: string;
  kind: 'file' | 'directory';
  children?: FileNode[];
}

/**
 * Build a nested tree from a flat list of file paths returned by the server.
 */
function buildFileTree(files: Array<{ path: string; isDirectory: boolean }>): FileNode[] {
  const root: FileNode[] = [];

  // Filter out common noise directories
  const skipDirs = new Set(['node_modules', '.git', 'dist', '.turbo', '.next', '__pycache__', '.cache']);

  for (const file of files) {
    const parts = file.path.replace(/\\/g, '/').split('/');
    
    // Skip files inside noise directories
    if (parts.some(p => skipDirs.has(p))) continue;

    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existing = current.find(n => n.name === part);

      if (existing) {
        if (existing.kind === 'directory' && existing.children) {
          current = existing.children;
        }
      } else {
        const node: FileNode = {
          name: part,
          kind: isLast && !file.isDirectory ? 'file' : 'directory',
          children: isLast && !file.isDirectory ? undefined : [],
        };
        current.push(node);
        if (node.children) {
          current = node.children;
        }
      }
    }
  }

  // Sort recursively: directories first, then alphabetical
  function sortTree(nodes: FileNode[]): FileNode[] {
    return nodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }).map(n => ({
      ...n,
      children: n.children ? sortTree(n.children) : undefined,
    }));
  }

  return sortTree(root);
}

async function readDirectoryRecursive(dirHandle: any, depth = 0): Promise<FileNode[]> {
  const nodes: FileNode[] = [];
  if (depth > 4) return nodes;

  const skipDirs = new Set(['node_modules', '.git', 'dist', '.turbo', '.next', '__pycache__', '.cache']);

  for await (const [name, handle] of dirHandle.entries()) {
    if (skipDirs.has(name)) continue;
    if (handle.kind === 'directory') {
      const children = await readDirectoryRecursive(handle, depth + 1);
      nodes.push({ name, kind: 'directory', children });
    } else {
      nodes.push({ name, kind: 'file' });
    }
  }

  // Sort: directories first, then alphabetical
  return nodes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function getFileIcon(name: string, isDir: boolean): string {
  if (isDir) return '📁';
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return '🇹';
    case 'js': case 'jsx': return '🟨';
    case 'json': return '📋';
    case 'css': case 'scss': return '🎨';
    case 'md': return '📝';
    case 'html': return '🌐';
    case 'yaml': case 'yml': return '⚙️';
    case 'env': return '🔒';
    case 'lock': return '🔐';
    case 'gitignore': return '🚫';
    default: return '📄';
  }
}

function getFileColor(name: string, isDir: boolean): string {
  if (isDir) return 'text-devos-accent';
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts': case 'tsx': return 'text-blue-400';
    case 'js': case 'jsx': return 'text-yellow-400';
    case 'json': return 'text-green-400';
    case 'css': case 'scss': return 'text-purple-400';
    case 'md': return 'text-gray-400';
    case 'html': return 'text-orange-400';
    case 'yaml': case 'yml': return 'text-pink-400';
    default: return 'text-devos-text-secondary';
  }
}

function FileTreeNode({ node, depth, parentPath, onFileClick }: { node: FileNode; depth: number; parentPath: string; onFileClick?: (filePath: string) => void }) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = node.kind === 'directory';
  const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  const handleClick = () => {
    if (isDir) {
      setOpen(!open);
    } else {
      onFileClick?.(fullPath);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 py-[3px] text-xs rounded px-1 transition-colors ${
          isDir ? 'hover:bg-devos-surface-hover cursor-pointer' : 'hover:bg-devos-surface-hover cursor-pointer'
        }`}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
      >
        {isDir ? (
          <span className="text-devos-text-secondary text-[10px] w-3 flex-shrink-0">{open ? '▼' : '▶'}</span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className={`flex-shrink-0 text-[11px] ${getFileColor(node.name, isDir)}`}>
          {getFileIcon(node.name, isDir)}
        </span>
        <span className={`truncate ${isDir ? 'text-devos-text font-medium' : 'text-devos-text-secondary'}`}>
          {node.name}
        </span>
      </button>
      {isDir && open && node.children?.map((child, i) => (
        <FileTreeNode key={i} node={child} depth={depth + 1} parentPath={fullPath} onFileClick={onFileClick} />
      ))}
    </div>
  );
}

function GitPanel({ projectPath }: { projectPath: string | null }) {
  const [gitData, setGitData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (projectPath) {
      setLoading(true);
      api.getGitStatus(projectPath)
        .then(setGitData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [projectPath]);

  if (!projectPath) return <div className="p-3 text-sm text-devos-text-secondary">No project open</div>;
  if (loading) return <div className="p-3 text-sm text-devos-text-secondary">Loading...</div>;

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-devos-text-secondary uppercase tracking-wider mb-3">Git</h3>
      {gitData ? (
        <div className="space-y-3">
          <div className="text-sm">
            <GitBranch size={14} className="inline mr-1" />
            {gitData.branch || 'detached'}
          </div>
          {gitData.status?.length > 0 && (
            <div>
              <div className="text-xs text-devos-text-secondary mb-1">Changes ({gitData.status.length})</div>
              <div className="space-y-0.5">
                {gitData.status.slice(0, 20).map((f: any, i: number) => (
                  <div key={i} className="text-xs font-mono flex items-center gap-1">
                    <span className={`w-4 text-center ${
                      f.status === 'M' ? 'text-devos-warning' :
                      f.status === 'A' ? 'text-devos-success' :
                      f.status === 'D' ? 'text-devos-error' :
                      'text-devos-text-secondary'
                    }`}>{f.status}</span>
                    <span className="truncate">{f.path}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {gitData.log?.length > 0 && (
            <div>
              <div className="text-xs text-devos-text-secondary mb-1">Recent commits</div>
              <div className="space-y-1">
                {gitData.log.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="text-xs">
                    <span className="font-mono text-devos-accent">{c.shortHash}</span>
                    <span className="ml-1 text-devos-text-secondary">{c.message?.slice(0, 50)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-devos-text-secondary">Not a git repository</div>
      )}
    </div>
  );
}

function DiagnosticsPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  const refresh = () => {
    setLoading(true);
    api.getSystemDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-devos-text-secondary uppercase tracking-wider">System</h3>
        <button onClick={refresh} className="text-devos-text-secondary hover:text-devos-text">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {data ? (
        <div className="space-y-3">
          <MetricBar label="CPU" value={data.cpu?.usagePercent ?? 0} />
          <MetricBar label="Memory" value={data.memory?.usagePercent ?? 0} />
          {data.disk?.map?.((d: any, i: number) => (
            <MetricBar key={i} label={`Disk ${d.mountpoint || d.filesystem}`} value={d.usagePercent ?? 0} />
          ))}
          <div className="text-xs text-devos-text-secondary space-y-1 pt-2 border-t border-devos-border">
            <div>💻 {data.info?.platform}</div>
            <div>🖥️ {data.cpu?.model}</div>
            <div>🧮 {data.cpu?.cores} cores</div>
          </div>
        </div>
      ) : loading ? (
        <div className="text-sm text-devos-text-secondary">Loading...</div>
      ) : null}
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value > 90 ? 'bg-devos-error' : value > 70 ? 'bg-devos-warning' : 'bg-devos-accent';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="text-devos-text-secondary">{value}%</span>
      </div>
      <div className="h-1.5 bg-devos-bg rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function HistoryPanel() {
  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-devos-text-secondary uppercase tracking-wider mb-3">History</h3>
      <div className="text-sm text-devos-text-secondary">No previous tasks</div>
    </div>
  );
}
