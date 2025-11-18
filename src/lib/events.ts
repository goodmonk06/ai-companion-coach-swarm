/**
 * Domain event system for decoupled event handling
 */

import { logger } from './logger';

export interface DomainEvent {
  type: string;
  timestamp: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

interface HandlerRegistration {
  handler: EventHandler;
  once: boolean;
}

class EventBus {
  private handlers: Map<string, HandlerRegistration[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  /**
   * Subscribe to an event type
   */
  on(eventType: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push({ handler, once: false });
    this.handlers.set(eventType, handlers);

    logger.debug(`Event handler registered for: ${eventType}`);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Subscribe to an event type (one-time only)
   */
  once(eventType: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push({ handler, once: true });
    this.handlers.set(eventType, handlers);

    logger.debug(`One-time event handler registered for: ${eventType}`);

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe from an event type
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) return;

    const filtered = handlers.filter((h) => h.handler !== handler);
    if (filtered.length > 0) {
      this.handlers.set(eventType, filtered);
    } else {
      this.handlers.delete(eventType);
    }

    logger.debug(`Event handler unregistered for: ${eventType}`);
  }

  /**
   * Subscribe to all events (global handler)
   */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);

    logger.debug('Global event handler registered');

    // Return unsubscribe function
    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event
   */
  async emit(event: DomainEvent): Promise<void> {
    logger.info(`Event emitted: ${event.type}`, { event: event.payload });

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(event.type) || [];
    const handlersToRemove: EventHandler[] = [];

    for (const { handler, once } of typeHandlers) {
      try {
        await handler(event);
        if (once) {
          handlersToRemove.push(handler);
        }
      } catch (error) {
        logger.error(`Error in event handler for ${event.type}`, error as Error, {
          eventType: event.type,
        });
      }
    }

    // Remove one-time handlers
    for (const handler of handlersToRemove) {
      this.off(event.type, handler);
    }

    // Call global handlers
    for (const handler of this.globalHandlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Error in global event handler for ${event.type}`, error as Error, {
          eventType: event.type,
        });
      }
    }
  }

  /**
   * Remove all handlers for a specific event type
   */
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
      logger.debug(`All handlers removed for: ${eventType}`);
    } else {
      this.handlers.clear();
      this.globalHandlers = [];
      logger.debug('All event handlers removed');
    }
  }

  /**
   * Get count of handlers for an event type
   */
  listenerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }
}

// Export singleton instance
export const eventBus = new EventBus();

// Export class for creating new instances
export { EventBus };

// Domain event types
export const EventTypes = {
  // Session events
  SESSION_STARTED: 'session.started',
  SESSION_MESSAGE_SENT: 'session.message.sent',
  SESSION_MESSAGE_RECEIVED: 'session.message.received',
  SESSION_ENDED: 'session.ended',
  SESSION_ARCHIVED: 'session.archived',

  // Goal events
  GOAL_CREATED: 'goal.created',
  GOAL_UPDATED: 'goal.updated',
  GOAL_PROGRESS_UPDATED: 'goal.progress.updated',
  GOAL_MILESTONE_REACHED: 'goal.milestone.reached',
  GOAL_COMPLETED: 'goal.completed',
  GOAL_ABANDONED: 'goal.abandoned',

  // Reflection events
  REFLECTION_CREATED: 'reflection.created',
  REFLECTION_UPDATED: 'reflection.updated',
  REFLECTION_DELETED: 'reflection.deleted',

  // Template events
  TEMPLATE_CREATED: 'template.created',
  TEMPLATE_USED: 'template.used',

  // Member events
  MEMBER_CREATED: 'member.created',
  MEMBER_UPDATED: 'member.updated',
  MEMBER_PREFERENCES_UPDATED: 'member.preferences.updated',

  // Coach events
  COACH_ASSIGNED: 'coach.assigned',
  COACH_UNASSIGNED: 'coach.unassigned',

  // Tag events
  TAG_CREATED: 'tag.created',
  ENTITY_TAGGED: 'entity.tagged',
  ENTITY_UNTAGGED: 'entity.untagged',
} as const;

// Event factory functions
export function createEvent(type: string, payload: Record<string, unknown>): DomainEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    payload,
    metadata: {},
  };
}

export function createSessionStartedEvent(sessionId: string, memberId: string, coachPersonaId: string): DomainEvent {
  return createEvent(EventTypes.SESSION_STARTED, {
    sessionId,
    memberId,
    coachPersonaId,
  });
}

export function createSessionEndedEvent(
  sessionId: string,
  memberId: string,
  durationMinutes: number,
  messageCount: number,
): DomainEvent {
  return createEvent(EventTypes.SESSION_ENDED, {
    sessionId,
    memberId,
    durationMinutes,
    messageCount,
  });
}

export function createGoalCreatedEvent(goalId: string, memberId: string, title: string): DomainEvent {
  return createEvent(EventTypes.GOAL_CREATED, {
    goalId,
    memberId,
    title,
  });
}

export function createGoalCompletedEvent(goalId: string, memberId: string, title: string): DomainEvent {
  return createEvent(EventTypes.GOAL_COMPLETED, {
    goalId,
    memberId,
    title,
  });
}

export function createMilestoneReachedEvent(
  goalId: string,
  memberId: string,
  milestone: string,
): DomainEvent {
  return createEvent(EventTypes.GOAL_MILESTONE_REACHED, {
    goalId,
    memberId,
    milestone,
  });
}

export function createReflectionCreatedEvent(reflectionId: string, memberId: string): DomainEvent {
  return createEvent(EventTypes.REFLECTION_CREATED, {
    reflectionId,
    memberId,
  });
}
