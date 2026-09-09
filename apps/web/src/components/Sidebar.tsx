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
}

const TABS = [
  { id: 'project' as const, icon: FolderOpen, label: 'Project' },
  { id: 'git' as const, icon: GitBranch, label: 'Git' },
  { id: 'diagnostics' as const, icon: Activity, label: 'System' },
  { id: 'history' as const, icon: Clock, label: 'History' },
];

export function Sidebar({ activeTab, onTabChange, projectPath, onProjectOpen }: SidebarProps) {
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
          <ProjectPanel projectPath={projectPath} onProjectOpen={onProjectOpen} />
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

function ProjectPanel({ projectPath, onProjectOpen }: { projectPath: string | null; onProjectOpen: (p: string) => void }) {
  const [inputPath, setInputPath] = useState('');
  const [projectInfo, setProjectInfo] = useState<any>(null);
  // File tree state reserved for future use
  const [loading, setLoading] = useState(false);
  const api = useApi();

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
            {loading ? 'Analyzing...' : 'Open Project'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-medium">{projectPath.split(/[\\/]/).pop()}</div>
          {projectInfo?.project && (
            <div className="space-y-1 text-xs text-devos-text-secondary">
              {projectInfo.project.languages?.length > 0 && (
                <div>📝 {projectInfo.project.languages.join(', ')}</div>
              )}
              {projectInfo.project.frameworks?.length > 0 && (
                <div>🛠️ {projectInfo.project.frameworks.join(', ')}</div>
              )}
              {projectInfo.project.packageManager && (
                <div>📦 {projectInfo.project.packageManager}</div>
              )}
              {projectInfo.index && (
                <div>📁 {projectInfo.index.totalFiles} files</div>
              )}
              {projectInfo.git && (
                <div>🔀 {projectInfo.git.branch} ({projectInfo.git.changedFiles} changes)</div>
              )}
            </div>
          )}
          <button
            onClick={() => { onProjectOpen(''); setProjectInfo(null); }}
            className="text-xs text-devos-text-secondary hover:text-devos-text"
          >
            Close project
          </button>
        </div>
      )}
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
