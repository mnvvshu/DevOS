import { useEffect } from 'react';

type ShortcutMap = Record<string, () => void>;

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      
      for (const [shortcut, handler] of Object.entries(shortcuts)) {
        const parts = shortcut.split('+');
        const key = parts[parts.length - 1]!;
        const needsMod = parts.includes('mod');
        const needsShift = parts.includes('shift');

        if (needsMod && !mod) continue;
        if (needsShift && !e.shiftKey) continue;
        if (e.key.toLowerCase() !== key.toLowerCase()) continue;

        e.preventDefault();
        handler();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
