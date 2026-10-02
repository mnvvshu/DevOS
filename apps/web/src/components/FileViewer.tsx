import { useState, useEffect } from 'react';
import { X, FileText, Copy, Check } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface FileViewerProps {
  projectPath: string;
  filePath: string;
  dirHandle?: any; // File System Access API directory handle
  onClose: () => void;
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'tsx', js: 'javascript', jsx: 'jsx',
    json: 'json', css: 'css', scss: 'scss', html: 'html',
    md: 'markdown', yaml: 'yaml', yml: 'yaml', py: 'python',
    rs: 'rust', go: 'go', java: 'java', sh: 'bash',
    env: 'env', gitignore: 'text', prettierrc: 'json',
    toml: 'toml', sql: 'sql', xml: 'xml', svg: 'svg',
    txt: 'text', lock: 'text',
  };
  return map[ext || ''] || 'text';
}

/**
 * Read a file from the browser's File System Access API directory handle.
 * Traverses the path segments to find the file.
 */
async function readFileFromHandle(dirHandle: any, filePath: string): Promise<string> {
  const parts = filePath.replace(/\\/g, '/').split('/');
  let currentHandle = dirHandle;

  // Navigate through directories
  for (let i = 0; i < parts.length - 1; i++) {
    currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
  }

  // Get the file
  const fileName = parts[parts.length - 1];
  const fileHandle = await currentHandle.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return await file.text();
}

export function FileViewer({ projectPath, filePath, dirHandle, onClose }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const api = useApi();

  const filename = filePath.split(/[/\\]/).pop() || filePath;
  const lang = getLanguage(filename);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setContent(null);

    const loadFile = async () => {
      try {
        if (dirHandle) {
          // Read from browser File System Access API
          const text = await readFileFromHandle(dirHandle, filePath);
          setContent(text);
        } else {
          // Read from server API
          const result = await api.getFileContent(projectPath, filePath);
          setContent(result.content);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [filePath, projectPath, dirHandle]);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content?.split('\n') || [];

  // Check if file is likely binary
  const isBinary = content && content.includes('\0');

  return (
    <div className="flex-1 flex flex-col bg-devos-bg overflow-hidden">
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 bg-devos-surface border-b border-devos-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-devos-text-secondary shrink-0" />
          <span className="text-sm font-mono text-devos-text truncate">{filename}</span>
          <span className="text-[10px] text-devos-text-secondary px-1.5 py-0.5 bg-devos-bg rounded font-mono uppercase">{lang}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-devos-surface-hover text-devos-text-secondary hover:text-devos-text transition-colors"
            title="Copy content"
          >
            {copied ? <Check size={14} className="text-devos-success" /> : <Copy size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-devos-surface-hover text-devos-text-secondary hover:text-devos-text transition-colors"
            title="Close file"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-devos-text-secondary animate-pulse">Loading file...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-2">
          <div className="text-sm text-devos-error">{error}</div>
          <button onClick={onClose} className="text-xs text-devos-text-secondary hover:text-devos-text">
            Close
          </button>
        </div>
      ) : isBinary ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-devos-text-secondary">Binary file — cannot display</div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse font-mono text-[13px] leading-[1.6]">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-devos-surface-hover/50 group">
                  <td className="w-12 text-right pr-4 pl-3 text-devos-text-secondary/40 select-none text-xs align-top sticky left-0 bg-devos-bg group-hover:bg-devos-surface-hover/50">
                    {i + 1}
                  </td>
                  <td className="pr-4 whitespace-pre text-devos-text/90 align-top">
                    {line || ' '}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="h-6 flex items-center justify-between px-4 bg-devos-surface border-t border-devos-border text-[10px] text-devos-text-secondary shrink-0">
        <span>{lines.length} lines</span>
        <span className="font-mono truncate ml-4">{filePath}</span>
      </div>
    </div>
  );
}
