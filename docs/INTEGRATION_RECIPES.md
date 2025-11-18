# Integration Recipes

This document provides recipes for integrating the AI Companion Coach Swarm with other systems.

## Table of Contents

1. [Authentication Integration](#authentication-integration)
2. [Notification Systems](#notification-systems)
3. [Analytics Platforms](#analytics-platforms)
4. [External Profile Sync](#external-profile-sync)
5. [File Storage](#file-storage)
6. [Webhook Integration](#webhook-integration)
7. [Calendar Integration](#calendar-integration)

## Authentication Integration

### Auth0 Integration

```typescript
// src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}

// Register middleware
server.addHook('onRequest', authMiddleware);
```

## Notification Systems

### SendGrid Email Notifications

```typescript
// src/adapters/sendgrid-notification.adapter.ts
import sgMail from '@sendgrid/mail';
import { INotificationAdapter } from '../lib/adapters';

export class SendGridNotificationAdapter implements INotificationAdapter {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await sgMail.send({
      to,
      from: process.env.FROM_EMAIL!,
      subject,
      html: body,
    });
  }

  async sendPush(userId: string, title: string, body: string): Promise<void> {
    // Implement push notifications
  }

  async sendSMS(phone: string, message: string): Promise<void> {
    // Implement SMS via Twilio
  }
}

// Register in index.ts
import { adapterRegistry, AdapterNames } from './lib/adapters';
import { SendGridNotificationAdapter } from './adapters/sendgrid-notification.adapter';

adapterRegistry.register(
  AdapterNames.NOTIFICATION,
  new SendGridNotificationAdapter()
);
```

### Goal Completion Notifications

```typescript
// src/handlers/goal-notification.handler.ts
import { eventBus, EventTypes } from '../lib/events';
import { adapterRegistry, AdapterNames, INotificationAdapter } from '../lib/adapters';

eventBus.on(EventTypes.GOAL_COMPLETED, async (event) => {
  const adapter = adapterRegistry.get<INotificationAdapter>(AdapterNames.NOTIFICATION);
  
  if (adapter) {
    const { memberId, title } = event.payload;
    
    // Send celebration email
    await adapter.sendEmail(
      memberEmail,
      `🎉 Goal Completed: ${title}`,
      `
        <h1>Congratulations!</h1>
        <p>You've completed your goal: <strong>${title}</strong></p>
        <p>Keep up the great work!</p>
      `
    );
  }
});
```

## Analytics Platforms

### Segment Integration

```typescript
// src/adapters/segment-analytics.adapter.ts
import Analytics from 'analytics-node';
import { IAnalyticsAdapter } from '../lib/adapters';

export class SegmentAnalyticsAdapter implements IAnalyticsAdapter {
  private analytics: Analytics;

  constructor() {
    this.analytics = new Analytics(process.env.SEGMENT_WRITE_KEY!);
  }

  async track(userId: string, event: string, properties?: Record<string, unknown>): Promise<void> {
    this.analytics.track({
      userId,
      event,
      properties,
    });
  }

  async identify(userId: string, traits: Record<string, unknown>): Promise<void> {
    this.analytics.identify({
      userId,
      traits,
    });
  }

  async page(userId: string, name: string, properties?: Record<string, unknown>): Promise<void> {
    this.analytics.page({
      userId,
      name,
      properties,
    });
  }
}
```

## External Profile Sync

### Integration with User Management System

```typescript
// src/adapters/user-profile.adapter.ts
import { IExternalProfileAdapter, ExternalProfile, LocalProfile } from '../lib/adapters';

export class UserManagementProfileAdapter implements IExternalProfileAdapter {
  async getProfile(userId: string): Promise<ExternalProfile | null> {
    const response = await fetch(`https://api.yourapp.com/users/${userId}`);
    return response.json();
  }

  async updateProfile(userId: string, data: Partial<ExternalProfile>): Promise<void> {
    await fetch(`https://api.yourapp.com/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async syncProfile(userId: string, localProfile: LocalProfile): Promise<void> {
    // Sync coaching data back to main user profile
    await this.updateProfile(userId, {
      metadata: {
        coachingGoals: localProfile.metadata?.totalGoals,
        coachingSessions: localProfile.metadata?.totalSessions,
      },
    });
  }
}
```

## File Storage

### S3 Storage for Session Exports

```typescript
// src/adapters/s3-storage.adapter.ts
import AWS from 'aws-sdk';
import { IStorageAdapter } from '../lib/adapters';

export class S3StorageAdapter implements IStorageAdapter {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.bucket = process.env.S3_BUCKET!;
  }

  async upload(key: string, data: Buffer, contentType?: string): Promise<string> {
    await this.s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    }).promise();

    return `s3://${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.s3.getObject({
      Bucket: this.bucket,
      Key: key,
    }).promise();

    return result.Body as Buffer;
  }

  async delete(key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucket,
      Key: key,
    }).promise();
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }
}
```

## Webhook Integration

### Outgoing Webhooks for Events

```typescript
// src/services/webhook.service.ts
import { eventBus, DomainEvent } from '../lib/events';

export class WebhookService {
  private webhookUrls: Map<string, string[]> = new Map();

  registerWebhook(eventType: string, url: string) {
    const urls = this.webhookUrls.get(eventType) || [];
    urls.push(url);
    this.webhookUrls.set(eventType, urls);

    // Listen to this event type
    eventBus.on(eventType, async (event) => {
      await this.sendWebhook(url, event);
    });
  }

  private async sendWebhook(url: string, event: DomainEvent) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': event.type,
          'X-Event-Timestamp': event.timestamp,
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error(`Failed to send webhook to ${url}:`, error);
    }
  }
}

// Usage
const webhookService = new WebhookService();
webhookService.registerWebhook(
  EventTypes.GOAL_COMPLETED,
  'https://yourapp.com/webhooks/goal-completed'
);
```

## Calendar Integration

### Google Calendar for Goal Deadlines

```typescript
// src/integrations/google-calendar.ts
import { google } from 'googleapis';
import { eventBus, EventTypes } from '../lib/events';

const calendar = google.calendar('v3');

eventBus.on(EventTypes.GOAL_CREATED, async (event) => {
  const { goalId, title, targetDate } = event.payload;

  if (targetDate) {
    await calendar.events.insert({
      auth: getAuthClient(),
      calendarId: 'primary',
      requestBody: {
        summary: `Goal Deadline: ${title}`,
        description: `Complete your goal: ${title}`,
        start: {
          dateTime: targetDate,
          timeZone: 'America/Los_Angeles',
        },
        end: {
          dateTime: targetDate,
          timeZone: 'America/Los_Angeles',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      },
    });
  }
});
```

## Best Practices

1. **Error Handling**: Always wrap adapter calls in try-catch
2. **Retry Logic**: Implement exponential backoff for external calls
3. **Circuit Breakers**: Fail fast when external services are down
4. **Logging**: Log all external service calls
5. **Testing**: Mock adapters in tests
6. **Configuration**: Use environment variables for credentials
7. **Monitoring**: Track success/failure rates of integrations
