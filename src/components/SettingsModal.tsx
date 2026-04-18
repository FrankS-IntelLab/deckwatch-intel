import { useState } from 'react';
import { getApiKey, setApiKey, getModel, setModel, getEndpoint, setEndpoint, PRESETS } from '../api/llm';

function getGhToken() { return localStorage.getItem('dw_gh_token') || ''; }
function setGhToken(t: string) { localStorage.setItem('dw_gh_token', t); }

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [key, setKey] = useState(getApiKey);
  const [model, setMdl] = useState(getModel);
  const [endpoint, setEp] = useState(getEndpoint);
  const [ghToken, setGhTk] = useState(getGhToken);
  const [preset, setPreset] = useState(() => {
    const ep = getEndpoint();
    const idx = PRESETS.findIndex(p => p.endpoint === ep);
    return idx >= 0 ? idx : PRESETS.length - 1;
  });

  if (!open) return null;

  function applyPreset(idx: number) {
    setPreset(idx);
    const p = PRESETS[idx];
    if (p.endpoint) setEp(p.endpoint);
    if (p.models.length) setMdl(p.models[0]);
  }

  function save() {
    setApiKey(key);
    setModel(model);
    setEndpoint(endpoint);
    setGhToken(ghToken);
    onClose();
  }

  const currentPreset = PRESETS[preset];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="t-card t-border border rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* GitHub Section */}
        <h2 className="text-sm font-bold text-neon-green uppercase tracking-widest mb-3">⑂ GitHub</h2>
        <label className="block text-xs text-text-muted mb-1">Personal Access Token <span className="opacity-50">(optional, for 5000 req/hr)</span></label>
        <input type="password" value={ghToken} onChange={e => setGhTk(e.target.value)} placeholder="ghp_..."
          className="w-full t-surface t-border border rounded px-3 py-2 text-xs mb-5 focus:outline-none focus:border-neon-green/50" />

        {/* LLM Section */}
        <h2 className="text-sm font-bold text-neon-cyan uppercase tracking-widest mb-3">◈ LLM</h2>
        <label className="block text-xs text-text-muted mb-1">Provider Preset</label>
        <div className="flex flex-wrap gap-1 mb-4">
          {PRESETS.map((p, i) => (
            <button key={p.name} onClick={() => applyPreset(i)}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors border ${preset === i ? 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30' : 'text-text-muted t-border hover:text-text-primary'}`}
            >{p.name}</button>
          ))}
        </div>

        <label className="block text-xs text-text-muted mb-1">API Endpoint</label>
        <input value={endpoint} onChange={e => setEp(e.target.value)} placeholder="https://api.example.com/v1/chat/completions"
          className="w-full t-surface t-border border rounded px-3 py-2 text-xs mb-4 focus:outline-none focus:border-neon-cyan/50" />

        <label className="block text-xs text-text-muted mb-1">Model</label>
        <div className="flex gap-2 mb-4">
          <input value={model} onChange={e => setMdl(e.target.value)} placeholder="model name"
            className="flex-1 t-surface t-border border rounded px-3 py-2 text-xs focus:outline-none focus:border-neon-cyan/50" />
          {currentPreset.models.length > 0 && (
            <select value={currentPreset.models.includes(model) ? model : ''} onChange={e => e.target.value && setMdl(e.target.value)}
              className="t-surface t-border border rounded px-2 py-2 text-xs focus:outline-none focus:border-neon-cyan/50">
              <option value="">presets</option>
              {currentPreset.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          )}
        </div>

        <label className="block text-xs text-text-muted mb-1">API Key</label>
        <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="sk-..."
          className="w-full t-surface t-border border rounded px-3 py-2 text-xs mb-6 focus:outline-none focus:border-neon-cyan/50" />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-text-muted t-border border rounded hover:text-text-primary transition-colors">Cancel</button>
          <button onClick={save} className="px-4 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}
