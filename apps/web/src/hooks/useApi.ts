import { useCallback } from 'react';

const API_BASE = '/api/v1';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((error as Record<string, string>).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export function useApi() {
  const chat = useCallback(async (message: string, projectPath?: string | null, sessionId?: string) => {
    return fetchApi<{
      taskId: string;
      sessionId: string;
      response: string;
      toolCalls: Array<{ name: string; input: unknown; success: boolean; durationMs: number }>;
      iterations: number;
      durationMs: number;
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, projectPath: projectPath || undefined, sessionId }),
    });
  }, []);

  const analyzeProject = useCallback(async (path: string) => {
    return fetchApi<{ project: unknown; index: unknown; git: unknown }>('/project/analyze', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }, []);

  const getSystemDashboard = useCallback(async () => {
    return fetchApi<{ cpu: unknown; memory: unknown; disk: unknown; info: unknown }>('/system/dashboard');
  }, []);

  const getGitStatus = useCallback(async (path: string) => {
    return fetchApi<{ branch: string; status: unknown[]; log: unknown[] }>('/project/git/status', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }, []);

  const getSettings = useCallback(async () => {
    return fetchApi<{
      aiProvider: string;
      hasOpenAIKey: boolean;
      hasAnthropicKey: boolean;
      hasGeminiKey: boolean;
    }>('/settings');
  }, []);

  const switchProvider = useCallback(async (provider: string) => {
    return fetchApi<{ success: boolean; provider: string }>('/settings/provider', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  }, []);

  const getProjectFiles = useCallback(async (path: string) => {
    return fetchApi<{ files: Array<{ path: string; isDirectory: boolean; size: number; modified: string }> }>('/project/files', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }, []);

  const getFileContent = useCallback(async (projectPath: string, filePath: string) => {
    return fetchApi<{ content: string; path: string }>('/settings/file-content', {
      method: 'POST',
      body: JSON.stringify({ projectPath, filePath }),
    });
  }, []);

  return { chat, analyzeProject, getSystemDashboard, getGitStatus, getSettings, switchProvider, getProjectFiles, getFileContent };
}
