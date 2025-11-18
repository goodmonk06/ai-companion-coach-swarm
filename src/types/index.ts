// Domain types

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ActionItem {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  completed?: boolean;
}

export interface SessionTranscript {
  messages: Message[];
}

export interface CoachConfig {
  temperature?: number;
  maxTokens?: number;
  systemPromptAddition?: string;
  [key: string]: unknown;
}

// API request/response types

export interface StartSessionRequest {
  memberId: string;
  coachPersonaId: string;
}

export interface StartSessionResponse {
  sessionId: string;
  coachName: string;
  message: string;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  response: string;
  timestamp: string;
}

export interface EndSessionResponse {
  summary: string;
  actionItems: ActionItem[];
  sessionDurationMinutes: number;
}

// Service types

export interface CoachingContext {
  sessionId: string;
  memberId: string;
  coachPersona: {
    id: string;
    name: string;
    styleDescriptionMarkdown: string;
    configJson: CoachConfig;
  };
  transcript: Message[];
}
