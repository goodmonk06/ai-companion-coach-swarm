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

// Goal types
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateGoalRequest {
  memberId: string;
  coachPersonaId?: string;
  title: string;
  description?: string;
  priority?: Priority;
  targetDate?: string;
  milestones?: Omit<Milestone, 'id' | 'completed' | 'completedAt'>[];
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  status?: GoalStatus;
  priority?: Priority;
  targetDate?: string;
  progress?: number;
}

export interface UpdateGoalProgressRequest {
  progress: number;
  note?: string;
}

export interface AddMilestoneRequest {
  title: string;
  description?: string;
  targetDate?: string;
}

// Template types
export interface SessionPrompt {
  order: number;
  text: string;
  type: 'question' | 'reflection' | 'action';
}

export interface CreateTemplateRequest {
  coachPersonaId?: string;
  key: string;
  title: string;
  description: string;
  category: string;
  prompts: Omit<SessionPrompt, 'order'>[];
  estimatedDuration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface StartSessionFromTemplateRequest {
  memberId: string;
  templateId: string;
  coachPersonaId?: string;
}

// Reflection types
export interface CreateReflectionRequest {
  memberId: string;
  title?: string;
  content: string;
  mood?: string;
  isPrivate?: boolean;
  tags?: string[];
}

export interface UpdateReflectionRequest {
  title?: string;
  content?: string;
  mood?: string;
  isPrivate?: boolean;
}

export interface SearchReflectionsRequest {
  memberId: string;
  query?: string;
  mood?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// Tag types
export interface CreateTagRequest {
  name: string;
  color?: string;
  category?: string;
}

export interface TagEntityRequest {
  entityId: string;
  tagId: string;
  entityType: 'session' | 'goal' | 'reflection';
}

// Preferences types
export interface UpdatePreferencesRequest {
  preferredCoachingStyle?: string;
  notificationsEnabled?: boolean;
  emailDigestFrequency?: 'daily' | 'weekly' | 'never';
  defaultSessionDuration?: number;
  privacyLevel?: 'private' | 'anonymous' | 'public';
  preferences?: Record<string, unknown>;
}

// Analytics types
export interface MemberAnalytics {
  memberId: string;
  totalSessions: number;
  totalGoals: number;
  completedGoals: number;
  totalReflections: number;
  averageSessionDuration: number;
  mostUsedCoach?: {
    id: string;
    name: string;
    sessionCount: number;
  };
  recentActivity: {
    date: string;
    sessions: number;
    reflections: number;
    goalsProgress: number;
  }[];
  goalCompletion Rate: number;
  streakDays: number;
}

export interface GoalInsights {
  goalId: string;
  title: string;
  daysSinceCreated: number;
  daysToTarget?: number;
  progressRate: number;
  estimatedCompletion?: string;
  relatedSessions: number;
}

// Export types
export interface ExportFormat {
  format: 'json' | 'markdown' | 'pdf';
  includeTranscripts?: boolean;
  includeSummaries?: boolean;
  includeGoals?: boolean;
  includeReflections?: boolean;
  startDate?: string;
  endDate?: string;
}
