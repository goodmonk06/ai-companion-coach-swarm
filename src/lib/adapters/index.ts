/**
 * Adapter interfaces for external integrations
 * These provide extension points for connecting to external systems
 */

// Notification adapter for sending alerts, reminders, etc.
export interface INotificationAdapter {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendPush(userId: string, title: string, body: string): Promise<void>;
  sendSMS(phone: string, message: string): Promise<void>;
}

// Metrics adapter for sending metrics to external systems
export interface IMetricsAdapter {
  recordCounter(name: string, value: number, labels?: Record<string, string>): Promise<void>;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void>;
  recordGauge(name: string, value: number, labels?: Record<string, string>): Promise<void>;
}

// External profile adapter for syncing with user profiles in other systems
export interface IExternalProfileAdapter {
  getProfile(userId: string): Promise<ExternalProfile | null>;
  updateProfile(userId: string, data: Partial<ExternalProfile>): Promise<void>;
  syncProfile(userId: string, localProfile: LocalProfile): Promise<void>;
}

export interface ExternalProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface LocalProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  timezone: string;
}

// Storage adapter for file uploads, exports, etc.
export interface IStorageAdapter {
  upload(key: string, data: Buffer, contentType?: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

// Analytics adapter for external analytics platforms
export interface IAnalyticsAdapter {
  track(userId: string, event: string, properties?: Record<string, unknown>): Promise<void>;
  identify(userId: string, traits: Record<string, unknown>): Promise<void>;
  page(userId: string, name: string, properties?: Record<string, unknown>): Promise<void>;
}

// AI/LLM adapter interface (allows swapping AI providers)
export interface IAIAdapter {
  generateResponse(
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    options?: AIGenerationOptions,
  ): Promise<string>;
  generateSummary(text: string, options?: AIGenerationOptions): Promise<string>;
  generateEmbedding(text: string): Promise<number[]>;
}

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Adapter registry for managing adapters
 */
export class AdapterRegistry {
  private adapters: Map<string, unknown> = new Map();

  register<T>(name: string, adapter: T): void {
    this.adapters.set(name, adapter);
  }

  get<T>(name: string): T | null {
    return (this.adapters.get(name) as T) || null;
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }

  remove(name: string): void {
    this.adapters.delete(name);
  }
}

// Global registry instance
export const adapterRegistry = new AdapterRegistry();

// Adapter names constants
export const AdapterNames = {
  NOTIFICATION: 'notification',
  METRICS: 'metrics',
  EXTERNAL_PROFILE: 'externalProfile',
  STORAGE: 'storage',
  ANALYTICS: 'analytics',
  AI: 'ai',
} as const;
