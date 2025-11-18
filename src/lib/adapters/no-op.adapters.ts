/**
 * No-op adapter implementations
 * These are stub implementations that can be used as defaults
 */

import { logger } from '../logger';
import {
  INotificationAdapter,
  IMetricsAdapter,
  IExternalProfileAdapter,
  IStorageAdapter,
  IAnalyticsAdapter,
  ExternalProfile,
  LocalProfile,
} from './index';

/**
 * No-op notification adapter (just logs)
 */
export class NoOpNotificationAdapter implements INotificationAdapter {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    logger.info('NoOp: Email notification', { to, subject, bodyLength: body.length });
  }

  async sendPush(userId: string, title: string, body: string): Promise<void> {
    logger.info('NoOp: Push notification', { userId, title, body });
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    logger.info('NoOp: SMS notification', { phone, message });
  }
}

/**
 * No-op metrics adapter (just logs)
 */
export class NoOpMetricsAdapter implements IMetricsAdapter {
  async recordCounter(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    logger.debug('NoOp: Counter metric', { name, value, labels });
  }

  async recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    logger.debug('NoOp: Histogram metric', { name, value, labels });
  }

  async recordGauge(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    logger.debug('NoOp: Gauge metric', { name, value, labels });
  }
}

/**
 * No-op external profile adapter
 */
export class NoOpExternalProfileAdapter implements IExternalProfileAdapter {
  async getProfile(userId: string): Promise<ExternalProfile | null> {
    logger.info('NoOp: Get external profile', { userId });
    return null;
  }

  async updateProfile(userId: string, data: Partial<ExternalProfile>): Promise<void> {
    logger.info('NoOp: Update external profile', { userId, data });
  }

  async syncProfile(userId: string, localProfile: LocalProfile): Promise<void> {
    logger.info('NoOp: Sync profile', { userId, localProfile });
  }
}

/**
 * In-memory storage adapter (for development/testing)
 */
export class InMemoryStorageAdapter implements IStorageAdapter {
  private storage: Map<string, { data: Buffer; contentType?: string }> = new Map();

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    this.storage.set(key, { data, contentType });
    logger.info('InMemory: File uploaded', { key, size: data.length, contentType });
    return `inmemory://${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const file = this.storage.get(key);
    if (!file) {
      throw new Error(`File not found: ${key}`);
    }
    logger.info('InMemory: File downloaded', { key });
    return file.data;
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
    logger.info('InMemory: File deleted', { key });
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    logger.info('InMemory: Generated signed URL', { key, expiresIn });
    return `inmemory://${key}?expires=${expiresIn || 3600}`;
  }
}

/**
 * No-op analytics adapter
 */
export class NoOpAnalyticsAdapter implements IAnalyticsAdapter {
  async track(userId: string, event: string, properties?: Record<string, unknown>): Promise<void> {
    logger.info('NoOp: Analytics track', { userId, event, properties });
  }

  async identify(userId: string, traits: Record<string, unknown>): Promise<void> {
    logger.info('NoOp: Analytics identify', { userId, traits });
  }

  async page(userId: string, name: string, properties?: Record<string, unknown>): Promise<void> {
    logger.info('NoOp: Analytics page', { userId, name, properties });
  }
}
