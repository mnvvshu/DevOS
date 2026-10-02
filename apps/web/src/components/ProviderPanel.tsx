import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Key, AlertCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';

interface ProviderPanelProps {
  onProviderChange?: (provider: string) => void;
}

interface ProviderInfo {
  id: string;
  name: string;
  logo: string;
  color: string;
  gradient: string;
  hasKey: boolean;
}

export function ProviderPanel({ onProviderChange }: ProviderPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    api.getSettings().then(settings => {
      setActiveProvider(settings.aiProvider);
      setProviders([
        {
          id: 'openai',
          name: 'OpenAI',
          logo: '🤖',
          color: '#10a37f',
          gradient: 'from-emerald-500/20 to-emerald-600/5',
          hasKey: settings.hasOpenAIKey,
        },
        {
          id: 'gemini',
          name: 'Gemini',
          logo: '✦',
          color: '#4285f4',
          gradient: 'from-blue-500/20 to-purple-500/5',
          hasKey: settings.hasGeminiKey,
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          logo: '🅰',
          color: '#d97757',
          gradient: 'from-orange-500/20 to-amber-500/5',
          hasKey: settings.hasAnthropicKey,
        },
      ]);
    }).catch(console.error);
  }, []);

  const handleSwitch = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider?.hasKey) return;
    
    setLoading(true);
    try {
      await api.switchProvider(providerId);
      setActiveProvider(providerId);
      onProviderChange?.(providerId);
    } catch (err) {
      console.error('Failed to switch provider:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Arrow Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-devos-surface border border-devos-border border-r-0 rounded-l-lg px-1 py-4 hover:bg-devos-surface-hover transition-all group"
        title="AI Providers"
        style={{ right: isOpen ? '280px' : '0' }}
      >
        {isOpen ? (
          <ChevronRight size={16} className="text-devos-text-secondary group-hover:text-devos-accent" />
        ) : (
          <ChevronLeft size={16} className="text-devos-text-secondary group-hover:text-devos-accent" />
        )}
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-12 bottom-0 w-[280px] bg-devos-surface border-l border-devos-border z-20 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-devos-accent/20 to-devos-accent/5 flex items-center justify-center">
              <Key size={16} className="text-devos-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-devos-text">AI Providers</h3>
              <p className="text-[10px] text-devos-text-secondary">Select your AI model</p>
            </div>
          </div>

          <div className="space-y-3">
            {providers.map(provider => {
              const isActive = activeProvider === provider.id;
              const isAvailable = provider.hasKey;

              return (
                <button
                  key={provider.id}
                  onClick={() => handleSwitch(provider.id)}
                  disabled={!isAvailable || loading}
                  className={`w-full rounded-xl p-3 text-left transition-all duration-200 border ${
                    isActive
                      ? 'border-devos-accent bg-gradient-to-br ' + provider.gradient + ' shadow-lg shadow-devos-accent/5'
                      : isAvailable
                        ? 'border-devos-border hover:border-devos-text-secondary/40 bg-devos-bg hover:bg-devos-surface-hover'
                        : 'border-devos-border/50 bg-devos-bg/50 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Logo */}
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold ${
                          isActive ? 'shadow-md' : ''
                        }`}
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${provider.color}22, ${provider.color}11)`
                            : 'var(--devos-surface-hover)',
                          border: isActive ? `1px solid ${provider.color}44` : '1px solid var(--devos-border)',
                        }}
                      >
                        {provider.id === 'openai' && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive ? provider.color : 'var(--devos-text-secondary)'}>
                            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
                          </svg>
                        )}
                        {provider.id === 'gemini' && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2C12 2 14.5 8.5 17 11C19.5 13.5 22 12 22 12C22 12 19.5 14.5 17 17C14.5 19.5 12 22 12 22C12 22 9.5 19.5 7 17C4.5 14.5 2 12 2 12C2 12 4.5 13.5 7 11C9.5 8.5 12 2 12 2Z" fill={isActive ? provider.color : 'var(--devos-text-secondary)'} />
                          </svg>
                        )}
                        {provider.id === 'anthropic' && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={isActive ? provider.color : 'var(--devos-text-secondary)'}>
                            <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.46-3.882H5.296l-1.46 3.882H.263L6.57 3.52zm.637 10.099h4.34L9.375 7.308l-2.169 6.311z" />
                          </svg>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-devos-text">{provider.name}</div>
                        <div className="text-[10px] text-devos-text-secondary">
                          {isAvailable ? (isActive ? 'Active' : 'Available') : 'No API Key'}
                        </div>
                      </div>
                    </div>

                    {/* Status indicator */}
                    <div className="flex items-center">
                      {isActive ? (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${provider.color}22` }}>
                          <Check size={14} style={{ color: provider.color }} />
                        </div>
                      ) : !isAvailable ? (
                        <AlertCircle size={14} className="text-devos-text-secondary/50" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-devos-border" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info */}
          <div className="mt-6 p-3 rounded-lg bg-devos-bg border border-devos-border">
            <p className="text-[11px] text-devos-text-secondary leading-relaxed">
              Configure API keys in your <code className="text-devos-accent font-mono">.env</code> file.
              Only providers with valid keys can be activated.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
