import { prisma } from '../lib/prisma';
import { eventBus, createGoalCreatedEvent, createGoalCompletedEvent, createMilestoneReachedEvent, EventTypes } from '../lib/events';
import { logger } from '../lib/logger';
import { metrics, MetricNames } from '../lib/metrics';
import { NotFoundError, ValidationError } from '../lib/errors';
import {
  CreateGoalRequest,
  UpdateGoalRequest,
  UpdateGoalProgressRequest,
  AddMilestoneRequest,
  Milestone,
  GoalStatus,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class GoalService {
  /**
   * Create a new coaching goal
   */
  async createGoal(request: CreateGoalRequest) {
    const requestLogger = logger.child({ memberId: request.memberId });
    requestLogger.info('Creating new goal', { title: request.title });

    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: request.memberId },
    });

    if (!member) {
      throw new NotFoundError('Member', request.memberId);
    }

    // Verify coach if provided
    if (request.coachPersonaId) {
      const coach = await prisma.coachPersona.findUnique({
        where: { id: request.coachPersonaId },
      });

      if (!coach) {
        throw new NotFoundError('Coach Persona', request.coachPersonaId);
      }
    }

    // Build milestones
    const milestones: Milestone[] = (request.milestones || []).map((m, index) => ({
      id: uuidv4(),
      title: m.title,
      description: m.description,
      targetDate: m.targetDate,
      completed: false,
    }));

    // Create goal
    const goal = await prisma.coachingGoal.create({
      data: {
        memberId: request.memberId,
        coachPersonaId: request.coachPersonaId,
        title: request.title,
        description: request.description,
        priority: request.priority || 'MEDIUM',
        targetDate: request.targetDate ? new Date(request.targetDate) : null,
        milestonesJson: milestones,
        status: 'ACTIVE',
        progress: 0,
      },
      include: {
        member: true,
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Emit event
    await eventBus.emit(createGoalCreatedEvent(goal.id, request.memberId, request.title));

    // Track metric
    metrics.incrementCounter(MetricNames.GOAL_CREATED, 1, {
      priority: request.priority || 'MEDIUM',
    });

    requestLogger.info('Goal created successfully', { goalId: goal.id });

    return {
      ...goal,
      milestones: goal.milestonesJson as Milestone[],
    };
  }

  /**
   * Get a goal by ID
   */
  async getGoal(goalId: string) {
    const goal = await prisma.coachingGoal.findUnique({
      where: { id: goalId },
      include: {
        member: true,
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!goal) {
      throw new NotFoundError('Goal', goalId);
    }

    return {
      ...goal,
      milestones: goal.milestonesJson as Milestone[],
    };
  }

  /**
   * Get all goals for a member
   */
  async getMemberGoals(
    memberId: string,
    filters?: {
      status?: GoalStatus;
      priority?: string;
      coachPersonaId?: string;
    },
  ) {
    const where: any = { memberId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.coachPersonaId) {
      where.coachPersonaId = filters.coachPersonaId;
    }

    const goals = await prisma.coachingGoal.findMany({
      where,
      include: {
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return goals.map((goal) => ({
      ...goal,
      milestones: goal.milestonesJson as Milestone[],
    }));
  }

  /**
   * Update a goal
   */
  async updateGoal(goalId: string, request: UpdateGoalRequest) {
    const goal = await this.getGoal(goalId);

    const updated = await prisma.coachingGoal.update({
      where: { id: goalId },
      data: {
        ...request,
        targetDate: request.targetDate ? new Date(request.targetDate) : undefined,
        completedAt: request.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        member: true,
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Emit completion event if status changed to COMPLETED
    if (request.status === 'COMPLETED' && goal.status !== 'COMPLETED') {
      await eventBus.emit(createGoalCompletedEvent(goalId, goal.memberId, goal.title));
      metrics.incrementCounter(MetricNames.GOAL_COMPLETED, 1);
    }

    logger.info('Goal updated', { goalId, changes: request });

    return {
      ...updated,
      milestones: updated.milestonesJson as Milestone[],
    };
  }

  /**
   * Update goal progress
   */
  async updateProgress(goalId: string, request: UpdateGoalProgressRequest) {
    if (request.progress < 0 || request.progress > 100) {
      throw new ValidationError('Progress must be between 0 and 100');
    }

    const goal = await this.getGoal(goalId);
    const oldProgress = goal.progress;

    const updated = await prisma.coachingGoal.update({
      where: { id: goalId },
      data: {
        progress: request.progress,
        ...(request.progress === 100 && {
          status: 'COMPLETED',
          completedAt: new Date(),
        }),
      },
      include: {
        member: true,
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Check for milestone thresholds (25%, 50%, 75%, 100%)
    const milestoneThresholds = [25, 50, 75, 100];
    for (const threshold of milestoneThresholds) {
      if (oldProgress < threshold && request.progress >= threshold) {
        await eventBus.emit(
          createMilestoneReachedEvent(goalId, goal.memberId, `${threshold}% progress`),
        );
      }
    }

    metrics.incrementCounter(MetricNames.GOAL_PROGRESS_UPDATED, 1);

    logger.info('Goal progress updated', { goalId, progress: request.progress });

    return {
      ...updated,
      milestones: updated.milestonesJson as Milestone[],
    };
  }

  /**
   * Add a milestone to a goal
   */
  async addMilestone(goalId: string, request: AddMilestoneRequest) {
    const goal = await this.getGoal(goalId);
    const currentMilestones = goal.milestones || [];

    const newMilestone: Milestone = {
      id: uuidv4(),
      title: request.title,
      description: request.description,
      targetDate: request.targetDate,
      completed: false,
    };

    const updated = await prisma.coachingGoal.update({
      where: { id: goalId },
      data: {
        milestonesJson: [...currentMilestones, newMilestone],
      },
      include: {
        member: true,
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    logger.info('Milestone added to goal', { goalId, milestoneId: newMilestone.id });

    return {
      ...updated,
      milestones: updated.milestonesJson as Milestone[],
    };
  }

  /**
   * Complete a milestone
   */
  async completeMilestone(goalId: string, milestoneId: string) {
    const goal = await this.getGoal(goalId);
    const milestones = goal.milestones || [];

    const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
    if (milestoneIndex === -1) {
      throw new NotFoundError('Milestone', milestoneId);
    }

    if (milestones[milestoneIndex].completed) {
      throw new ValidationError('Milestone is already completed');
    }

    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      completed: true,
      completedAt: new Date().toISOString(),
    };

    const updated = await prisma.coachingGoal.update({
      where: { id: goalId },
      data: {
        milestonesJson: milestones,
      },
      include: {
        member: true,
        coachPersona: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Emit event
    await eventBus.emit(
      createMilestoneReachedEvent(goalId, goal.memberId, milestones[milestoneIndex].title),
    );

    logger.info('Milestone completed', { goalId, milestoneId });

    return {
      ...updated,
      milestones: updated.milestonesJson as Milestone[],
    };
  }

  /**
   * Delete a goal
   */
  async deleteGoal(goalId: string) {
    const goal = await this.getGoal(goalId);

    await prisma.coachingGoal.delete({
      where: { id: goalId },
    });

    logger.info('Goal deleted', { goalId });

    return { success: true };
  }

  /**
   * Get goal insights
   */
  async getGoalInsights(goalId: string) {
    const goal = await this.getGoal(goalId);

    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const daysToTarget = goal.targetDate
      ? Math.floor(
          (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
      : undefined;

    const progressRate = daysSinceCreated > 0 ? goal.progress / daysSinceCreated : 0;

    const estimatedCompletion =
      progressRate > 0 && goal.progress < 100
        ? new Date(
            Date.now() + ((100 - goal.progress) / progressRate) * 24 * 60 * 60 * 1000,
          ).toISOString()
        : undefined;

    // Count related sessions (simplified - would need more complex query in production)
    const relatedSessions = 0; // TODO: Implement session-goal linking

    return {
      goalId: goal.id,
      title: goal.title,
      daysSinceCreated,
      daysToTarget,
      progressRate,
      estimatedCompletion,
      relatedSessions,
      status: goal.status,
      progress: goal.progress,
      milestones: goal.milestones,
      completedMilestones: (goal.milestones || []).filter((m) => m.completed).length,
      totalMilestones: (goal.milestones || []).length,
    };
  }
}

export const goalService = new GoalService();
