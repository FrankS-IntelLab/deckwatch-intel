const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export function getApiKey(): string {
  return localStorage.getItem('dw_api_key') || '';
}

export function setApiKey(key: string) {
  localStorage.setItem('dw_api_key', key);
}

export function getModel(): string {
  return localStorage.getItem('dw_model') || 'qwen-plus';
}

export function setModel(model: string) {
  localStorage.setItem('dw_model', model);
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error('API key not configured. Click ⚙ to set your DashScope API key.');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
