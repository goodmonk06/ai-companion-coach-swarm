import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionService } from '../session.service';

// Mock dependencies
vi.mock('../../lib/prisma', () => ({
  prisma: {
    member: {
      findUnique: vi.fn(),
    },
    coachPersona: {
      findUnique: vi.fn(),
    },
    memberCoachAssignment: {
      findUnique: vi.fn(),
    },
    coachingSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../llm.service', () => ({
  llmService: {
    generateGreeting: vi.fn(() => Promise.resolve('Welcome! How can I help you today?')),
    generateCoachingResponse: vi.fn(() =>
      Promise.resolve('Thank you for sharing. Tell me more about that.'),
    ),
    generateSessionSummary: vi.fn(() =>
      Promise.resolve({
        summary: 'Great session exploring goals.',
        actionItems: JSON.stringify([
          { title: 'Set weekly goal', description: 'Define one clear goal', priority: 'high' },
        ]),
      }),
    ),
  },
}));

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    service = new SessionService();
    vi.clearAllMocks();
  });

  describe('startSession', () => {
    it('should throw error if member not found', async () => {
      const { prisma } = await import('../../lib/prisma');
      vi.mocked(prisma.member.findUnique).mockResolvedValue(null);

      await expect(service.startSession('member-id', 'coach-id')).rejects.toThrow(
        'Member not found',
      );
    });

    it('should throw error if coach persona not found', async () => {
      const { prisma } = await import('../../lib/prisma');
      vi.mocked(prisma.member.findUnique).mockResolvedValue({
        id: 'member-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(prisma.coachPersona.findUnique).mockResolvedValue(null);

      await expect(service.startSession('member-id', 'coach-id')).rejects.toThrow(
        'Coach persona not found',
      );
    });
  });

  describe('sendMessage', () => {
    it('should throw error if session not found', async () => {
      const { prisma } = await import('../../lib/prisma');
      vi.mocked(prisma.coachingSession.findUnique).mockResolvedValue(null);

      await expect(service.sendMessage('session-id', 'Hello')).rejects.toThrow(
        'Session not found',
      );
    });

    it('should throw error if session has ended', async () => {
      const { prisma } = await import('../../lib/prisma');
      vi.mocked(prisma.coachingSession.findUnique).mockResolvedValue({
        id: 'session-id',
        memberId: 'member-id',
        coachPersonaId: 'coach-id',
        startedAt: new Date(),
        endedAt: new Date(),
        transcriptJson: [],
        summaryMarkdown: null,
        actionItemsJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        coachPersona: {
          id: 'coach-id',
          key: 'test-coach',
          name: 'Test Coach',
          styleDescriptionMarkdown: 'Test style',
          configJson: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        member: {
          id: 'member-id',
          email: 'test@example.com',
          name: 'Test User',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await expect(service.sendMessage('session-id', 'Hello')).rejects.toThrow(
        'Session has already ended',
      );
    });
  });
});
