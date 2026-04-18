import { useState } from 'react';
import { getApiKey, setApiKey, getModel, setModel } from '../api/llm';

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [key, setKey] = useState(getApiKey);
  const [model, setMdl] = useState(getModel);

  if (!open) return null;

  function save() {
    setApiKey(key);
    setModel(model);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-lite-card border border-lite-border rounded-lg p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-sm font-bold text-neon-cyan uppercase tracking-widest mb-4">⚙ Settings</h2>
        <label className="block text-xs text-text-muted mb-1">DashScope API Key</label>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder="sk-..."
          className="w-full bg-lite-surface border border-lite-border rounded px-3 py-2 text-sm text-text-primary mb-4 focus:outline-none focus:border-neon-cyan/50"
        />
        <label className="block text-xs text-text-muted mb-1">Model</label>
        <select
          value={model}
          onChange={e => setMdl(e.target.value)}
          className="w-full bg-lite-surface border border-lite-border rounded px-3 py-2 text-sm text-text-primary mb-6 focus:outline-none focus:border-neon-cyan/50"
        >
          <option value="qwen-turbo">qwen-turbo</option>
          <option value="qwen-plus">qwen-plus</option>
          <option value="qwen-max">qwen-max</option>
        </select>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-1.5 text-xs text-text-muted border border-lite-border rounded hover:text-text-primary transition-colors">Cancel</button>
          <button onClick={save} className="px-4 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded bg-neon-cyan/10 hover:bg-neon-cyan/20 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}
