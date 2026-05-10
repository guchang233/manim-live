export interface ManimProject {
  id: string;
  name: string;
  manimCode: string;
  previewCode: string; // React component code as string
  description: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  project?: Partial<ManimProject>;
}

export interface Session {
  id: string;
  title: string;
  messages: ChatMessage[];
  currentProject: Partial<ManimProject>;
  updatedAt: number;
}

export interface UserSettings {
  customSystemPrompt: string;
  model: string;
  theme: 'vs-dark' | 'light';
  apiBaseUrl: string;
  customApiKey: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  customSystemPrompt: '',
  model: 'gemini-3.1-pro-preview',
  theme: 'vs-dark',
  apiBaseUrl: '',
  customApiKey: ''
};
