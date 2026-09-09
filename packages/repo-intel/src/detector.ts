import fs from 'node:fs';
import path from 'node:path';
import type { ProjectInfo } from '@devos/shared';
import { getLogger } from '@devos/logger';

const logger = getLogger({ module: 'repo-intel' });

// File → language mapping
const LANGUAGE_INDICATORS: Record<string, string[]> = {
  'package.json': ['JavaScript', 'TypeScript'],
  'tsconfig.json': ['TypeScript'],
  'Cargo.toml': ['Rust'],
  'go.mod': ['Go'],
  'requirements.txt': ['Python'],
  'pyproject.toml': ['Python'],
  'Pipfile': ['Python'],
  'setup.py': ['Python'],
  'Gemfile': ['Ruby'],
  'pom.xml': ['Java'],
  'build.gradle': ['Java', 'Kotlin'],
  'build.gradle.kts': ['Kotlin'],
  'composer.json': ['PHP'],
  'mix.exs': ['Elixir'],
  'Package.swift': ['Swift'],
  '.csproj': ['C#'],
  'CMakeLists.txt': ['C', 'C++'],
};

// Framework detection from package.json
const FRAMEWORK_PACKAGES: Record<string, string> = {
  'react': 'React',
  'next': 'Next.js',
  'vue': 'Vue.js',
  'nuxt': 'Nuxt',
  'svelte': 'Svelte',
  '@sveltejs/kit': 'SvelteKit',
  'angular': 'Angular',
  '@angular/core': 'Angular',
  'express': 'Express',
  'fastify': 'Fastify',
  'koa': 'Koa',
  'hono': 'Hono',
  'nestjs': 'NestJS',
  '@nestjs/core': 'NestJS',
  'django': 'Django',
  'flask': 'Flask',
  'fastapi': 'FastAPI',
  'rails': 'Rails',
  'spring-boot': 'Spring Boot',
  'electron': 'Electron',
  'tauri': 'Tauri',
};

// Package manager detection
const PACKAGE_MANAGERS: Record<string, string> = {
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
  'bun.lockb': 'bun',
  'Cargo.lock': 'cargo',
  'go.sum': 'go modules',
  'Pipfile.lock': 'pipenv',
  'poetry.lock': 'poetry',
  'Gemfile.lock': 'bundler',
  'composer.lock': 'composer',
};

// Test framework detection
const TEST_FRAMEWORKS: Record<string, string> = {
  'vitest': 'Vitest',
  'jest': 'Jest',
  'mocha': 'Mocha',
  'pytest': 'pytest',
  'rspec': 'RSpec',
  'junit': 'JUnit',
  '@playwright/test': 'Playwright',
  'cypress': 'Cypress',
};

// Build system detection
const BUILD_SYSTEMS: Record<string, string> = {
  'vite': 'Vite',
  'webpack': 'webpack',
  'esbuild': 'esbuild',
  'rollup': 'Rollup',
  'turbo': 'Turborepo',
  'nx': 'Nx',
  'parcel': 'Parcel',
};

// Important files to always note
const IMPORTANT_FILE_PATTERNS = [
  'README.md',
  'package.json',
  'tsconfig.json',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Dockerfile',
  '.github/workflows',
  '.env.example',
  'Makefile',
];

export async function detectProject(projectPath: string): Promise<ProjectInfo> {
  logger.info('Detecting project', { path: projectPath });

  const info: ProjectInfo = {
    path: projectPath,
    name: path.basename(projectPath),
    languages: [],
    frameworks: [],
    packageManager: null,
    buildSystem: null,
    testFramework: null,
    hasDocker: false,
    hasCI: false,
    entryPoints: [],
    importantFiles: [],
  };

  // Scan root directory files
  let rootFiles: string[];
  try {
    rootFiles = fs.readdirSync(projectPath);
  } catch {
    return info;
  }

  // Detect languages
  const languageSet = new Set<string>();
  for (const file of rootFiles) {
    const indicators = LANGUAGE_INDICATORS[file];
    if (indicators) {
      indicators.forEach(l => languageSet.add(l));
    }
  }
  
  // Also detect by file extensions in src/
  // Scan first 2 levels for source files
  detectLanguagesByExtension(projectPath, languageSet, 0, 2);
  info.languages = [...languageSet];

  // Detect package manager
  for (const [file, manager] of Object.entries(PACKAGE_MANAGERS)) {
    if (rootFiles.includes(file)) {
      info.packageManager = manager;
      break;
    }
  }

  // Parse package.json if exists
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      // Detect frameworks
      for (const [pkg_name, framework] of Object.entries(FRAMEWORK_PACKAGES)) {
        if (allDeps[pkg_name]) {
          info.frameworks.push(framework);
        }
      }

      // Detect test framework
      for (const [pkg_name, framework] of Object.entries(TEST_FRAMEWORKS)) {
        if (allDeps[pkg_name]) {
          info.testFramework = framework;
          break;
        }
      }

      // Detect build system
      for (const [pkg_name, system] of Object.entries(BUILD_SYSTEMS)) {
        if (allDeps[pkg_name]) {
          info.buildSystem = system;
          break;
        }
      }

      // Detect entry points from scripts
      if (pkg.main) info.entryPoints.push(pkg.main);
      if (pkg.scripts?.start) {
        // Try to extract entry file from start script
        const startMatch = pkg.scripts.start.match(/(?:node|ts-node|tsx)\s+(\S+)/);
        if (startMatch?.[1]) info.entryPoints.push(startMatch[1]);
      }
    } catch (e) {
      logger.warn('Failed to parse package.json', { error: String(e) });
    }
  }

  // Docker detection
  info.hasDocker = rootFiles.some(f => 
    f === 'Dockerfile' || f === 'docker-compose.yml' || f === 'docker-compose.yaml'
  );

  // CI detection
  info.hasCI = fs.existsSync(path.join(projectPath, '.github', 'workflows'))
    || rootFiles.includes('.gitlab-ci.yml')
    || rootFiles.includes('Jenkinsfile')
    || rootFiles.includes('.circleci');

  // Collect important files
  for (const pattern of IMPORTANT_FILE_PATTERNS) {
    const fullPath = path.join(projectPath, pattern);
    if (fs.existsSync(fullPath)) {
      info.importantFiles.push(pattern);
    }
  }

  // Add common source directories
  for (const dir of ['src', 'app', 'lib', 'server', 'client', 'api', 'pages', 'components']) {
    if (fs.existsSync(path.join(projectPath, dir))) {
      info.importantFiles.push(dir + '/');
    }
  }

  logger.info('Project detected', {
    languages: info.languages,
    frameworks: info.frameworks,
    packageManager: info.packageManager,
  });

  return info;
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.rs': 'Rust',
  '.go': 'Go',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.swift': 'Swift',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
};

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '__pycache__', 'target', 'vendor']);

function detectLanguagesByExtension(dirPath: string, languages: Set<string>, depth: number, maxDepth: number): void {
  if (depth >= maxDepth) return;
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        detectLanguagesByExtension(path.join(dirPath, entry.name), languages, depth + 1, maxDepth);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        const lang = EXTENSION_LANGUAGE_MAP[ext];
        if (lang) languages.add(lang);
      }
    }
  } catch {
    // Permission denied or other filesystem error
  }
}
