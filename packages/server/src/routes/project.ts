import type { FastifyInstance } from 'fastify';
import { detectProject, indexProject } from '@devos/repo-intel';
import { GitOps } from '@devos/git-ops';

export async function projectRoutes(app: FastifyInstance) {
  // Analyze a project
  app.post('/analyze', async (request, reply) => {
    const { path: projectPath } = request.body as { path: string };
    if (!projectPath) return reply.status(400).send({ error: 'path is required' });

    const info = await detectProject(projectPath);
    const index = await indexProject(projectPath);
    const git = new GitOps(projectPath);
    const isGitRepo = await git.isRepo();
    
    let gitInfo = null;
    if (isGitRepo) {
      const [statusResult, branchResult] = await Promise.all([
        git.status(),
        git.currentBranch(),
      ]);
      gitInfo = {
        branch: branchResult.success ? branchResult.data : null,
        changedFiles: statusResult.success ? statusResult.data.length : 0,
      };
    }

    return reply.send({
      project: info,
      index: {
        totalFiles: index.totalFiles,
        totalSize: index.totalSize,
      },
      git: gitInfo,
    });
  });

  // Get project file tree
  app.post('/files', async (request, reply) => {
    const { path: projectPath } = request.body as { path: string };
    if (!projectPath) return reply.status(400).send({ error: 'path is required' });

    const index = await indexProject(projectPath);
    return reply.send({
      files: index.files.map(f => ({
        path: f.relativePath,
        isDirectory: f.isDirectory,
        size: f.sizeBytes,
        modified: f.modifiedAt.toISOString(),
      })),
    });
  });

  // Git status
  app.post('/git/status', async (request, reply) => {
    const { path: projectPath } = request.body as { path: string };
    if (!projectPath) return reply.status(400).send({ error: 'path is required' });

    const git = new GitOps(projectPath);
    const [status, branch, log] = await Promise.all([
      git.status(),
      git.currentBranch(),
      git.log(10),
    ]);

    return reply.send({
      branch: branch.success ? branch.data : null,
      status: status.success ? status.data : [],
      log: log.success ? log.data : [],
    });
  });

  // Git diff
  app.post('/git/diff', async (request, reply) => {
    const { path: projectPath, file } = request.body as { path: string; file?: string };
    if (!projectPath) return reply.status(400).send({ error: 'path is required' });

    const git = new GitOps(projectPath);
    const diff = await git.diff(file);

    return reply.send({
      diff: diff.success ? diff.data : '',
      error: diff.success ? null : diff.error?.message,
    });
  });
}
