const STORAGE_PREFIX = 'dw_';

function get(key: string, fallback: string): string {
  return localStorage.getItem(STORAGE_PREFIX + key) || fallback;
}
function set(key: string, value: string) {
  localStorage.setItem(STORAGE_PREFIX + key, value);
}

export function getApiKey(): string { return get('api_key', ''); }
export function setApiKey(key: string) { set('api_key', key); }
export function getModel(): string { return get('model', 'qwen-plus'); }
export function setModel(model: string) { set('model', model); }
export function getEndpoint(): string { return get('endpoint', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'); }
export function setEndpoint(url: string) { set('endpoint', url); }

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('API key not configured. Click ⚙ to set your API key.');

  const res = await fetch(getEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({ model: getModel(), messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

export interface ProviderPreset {
  name: string;
  endpoint: string;
  models: string[];
}

export const PRESETS: ProviderPreset[] = [
  { name: 'DashScope (Alibaba)', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'] },
  { name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { name: 'Anthropic (via proxy)', endpoint: '', models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'] },
  { name: 'DeepSeek', endpoint: 'https://api.deepseek.com/chat/completions', models: ['deepseek-chat', 'deepseek-reasoner'] },
  { name: 'OpenRouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4-20250514', 'google/gemini-pro'] },
  { name: 'Custom', endpoint: '', models: [] },
];
