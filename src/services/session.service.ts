import { prisma } from '../lib/prisma';
import { llmService } from './llm.service';
import { Message, ActionItem, CoachConfig } from '../types';
import { eventBus, createSessionStartedEvent, createSessionEndedEvent } from '../lib/events';
import { metrics, MetricNames } from '../lib/metrics';
import { logger } from '../lib/logger';
import { NotFoundError, ValidationError } from '../lib/errors';

export class SessionService {
  /**
   * Start a new coaching session
   */
  async startSession(memberId: string, coachPersonaId: string) {
    // Verify member and coach exist and are associated
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundError('Member', memberId);
    }

    const coachPersona = await prisma.coachPersona.findUnique({
      where: { id: coachPersonaId },
    });

    if (!coachPersona) {
      throw new NotFoundError('Coach Persona', coachPersonaId);
    }

    // Check if member has this coach assigned
    const assignment = await prisma.memberCoachAssignment.findUnique({
      where: {
        memberId_coachPersonaId: {
          memberId,
          coachPersonaId,
        },
      },
    });

    if (!assignment || !assignment.active) {
      throw new ValidationError('Coach not assigned to this member');
    }

    // Create the session
    const session = await prisma.coachingSession.create({
      data: {
        memberId,
        coachPersonaId,
        transcriptJson: [],
        status: 'ACTIVE',
      },
    });

    logger.info('Session started', { sessionId: session.id, memberId, coachPersonaId });
    await eventBus.emit(createSessionStartedEvent(session.id, memberId, coachPersonaId));
    metrics.incrementCounter(MetricNames.SESSION_STARTED, 1, { coachPersonaId });

    // Generate initial greeting
    const greeting = await llmService.generateGreeting(
      coachPersona.name,
      coachPersona.styleDescriptionMarkdown,
    );

    // Add greeting to transcript
    const initialMessage: Message = {
      role: 'assistant',
      content: greeting,
      timestamp: new Date().toISOString(),
    };

    await prisma.coachingSession.update({
      where: { id: session.id },
      data: {
        transcriptJson: [initialMessage],
      },
    });

    return {
      sessionId: session.id,
      coachName: coachPersona.name,
      greeting,
    };
  }

  /**
   * Send a message in an active session
   */
  async sendMessage(sessionId: string, userMessage: string) {
    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId },
      include: {
        coachPersona: true,
        member: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    if (session.endedAt) {
      throw new ValidationError('Session has already ended');
    }

    // Add user message to transcript
    const userMsg: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    const currentTranscript = session.transcriptJson as Message[];
    const updatedTranscript = [...currentTranscript, userMsg];

    // Generate coach response
    const config = session.coachPersona.configJson as CoachConfig;
    const coachResponse = await llmService.generateCoachingResponse(
      session.coachPersona.name,
      session.coachPersona.styleDescriptionMarkdown,
      config,
      updatedTranscript,
    );

    // Add coach response to transcript
    const assistantMsg: Message = {
      role: 'assistant',
      content: coachResponse,
      timestamp: new Date().toISOString(),
    };

    const finalTranscript = [...updatedTranscript, assistantMsg];

    // Update session with new transcript
    await prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        transcriptJson: finalTranscript,
      },
    });

    return {
      response: coachResponse,
      timestamp: assistantMsg.timestamp,
    };
  }

  /**
   * End a session and generate summary
   */
  async endSession(sessionId: string) {
    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    if (session.endedAt) {
      throw new ValidationError('Session already ended');
    }

    const transcript = session.transcriptJson as Message[];

    if (transcript.length === 0) {
      throw new ValidationError('Cannot end session with no messages');
    }

    // Generate summary and action items
    const { summary, actionItems } = await llmService.generateSessionSummary(transcript);

    // Calculate session duration
    const startTime = new Date(session.startedAt).getTime();
    const endTime = Date.now();
    const durationMinutes = Math.round((endTime - startTime) / 1000 / 60);

    // Update session
    const updatedSession = await prisma.coachingSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        summaryMarkdown: summary,
        actionItemsJson: actionItems,
        status: 'COMPLETED',
      },
    });

    const messageCount = transcript.length;
    logger.info('Session ended', { sessionId, durationMinutes, messageCount });
    await eventBus.emit(createSessionEndedEvent(sessionId, session.memberId, durationMinutes, messageCount));
    metrics.incrementCounter(MetricNames.SESSION_ENDED, 1);
    metrics.recordHistogram(MetricNames.SESSION_DURATION, durationMinutes);
    metrics.recordHistogram(MetricNames.SESSION_MESSAGE_COUNT, messageCount);

    return {
      summary,
      actionItems: JSON.parse(actionItems) as ActionItem[],
      sessionDurationMinutes: durationMinutes,
    };
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string) {
    const session = await prisma.coachingSession.findUnique({
      where: { id: sessionId },
      include: {
        member: true,
        coachPersona: true,
      },
    });

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    return {
      ...session,
      transcript: session.transcriptJson as Message[],
      actionItems: session.actionItemsJson ? (JSON.parse(session.actionItemsJson as string) as ActionItem[]) : null,
    };
  }

  /**
   * Get all sessions for a member
   */
  async getMemberSessions(memberId: string) {
    const sessions = await prisma.coachingSession.findMany({
      where: { memberId },
      include: {
        coachPersona: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      ...session,
      transcript: session.transcriptJson as Message[],
      actionItems: session.actionItemsJson ? (JSON.parse(session.actionItemsJson as string) as ActionItem[]) : null,
    }));
  }
}

export const sessionService = new SessionService();
