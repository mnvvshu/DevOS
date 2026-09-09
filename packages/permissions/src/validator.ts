import * as path from 'path';

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'format',
  'del /s /q',
  'mkfs',
  'dd if=',
  'chmod 777',
  ':(){:|:&};:',
  'shutdown',
  'reboot',
  'halt',
  'poweroff',
  'net user',
  'net localgroup',
  'reg delete',
  'reg add',
];

const BLOCKED_PATTERNS = [
  /rm\s+(-[rRf]+\s+)*\//,        // rm -rf /
  />(\s*)\/dev\/sd/,              // overwrite disk
  /\|\s*sudo/,                     // pipe to sudo
  /sudo\s+su/,                     // sudo su
  /chmod\s+[0-7]*777/,             // chmod 777
  /curl.*\|\s*(ba)?sh/,            // curl | sh
  /wget.*\|\s*(ba)?sh/,            // wget | sh
  /eval\s*\(/,                     // eval(
  /`.*`/,                           // backtick execution
  /\$\(.*\)/,                       // command substitution
  /format\s+[A-Z]:/i,               // Windows format drive
  /del\s+\/s\s+\/q\s+[a-z]:\\/i,    // Windows recursive delete from root
];

export function validateCommand(command: string, args: string[]): { allowed: boolean; reason?: string } {
  const fullCommand = `${command} ${args.join(' ')}`.toLowerCase();
  
  // Check blocked commands
  for (const blocked of BLOCKED_COMMANDS) {
    if (fullCommand.includes(blocked.toLowerCase())) {
      return { allowed: false, reason: `Blocked command pattern: ${blocked}` };
    }
  }

  // Check blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullCommand)) {
      return { allowed: false, reason: `Matches blocked pattern: ${pattern}` };
    }
  }

  return { allowed: true };
}

export function validatePath(requestedPath: string, projectPath: string): { allowed: boolean; reason?: string } {
  // Normalize and resolve paths
  const resolved = path.resolve(projectPath, requestedPath);
  const normalizedProject = path.resolve(projectPath);
  
  // Check for path traversal
  if (!resolved.startsWith(normalizedProject)) {
    return { allowed: false, reason: 'Path traversal detected: path escapes project directory' };
  }

  // Check for sensitive files
  const basename = path.basename(resolved).toLowerCase();
  const SENSITIVE_FILES = ['.env', '.env.local', 'id_rsa', 'id_ed25519', '.npmrc', '.pypirc'];
  if (SENSITIVE_FILES.includes(basename)) {
    return { allowed: false, reason: `Access to sensitive file: ${basename}` };
  }

  return { allowed: true };
}
