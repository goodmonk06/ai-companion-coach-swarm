import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { NotFoundError } from '../lib/errors';
import { MemberAnalytics } from '../types';

export class AnalyticsService {
  async getMemberAnalytics(memberId: string): Promise<MemberAnalytics> {
    logger.info('Generating member analytics', { memberId });

    // Verify member exists
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundError('Member', memberId);

    // Aggregate session stats
    const sessions = await prisma.coachingSession.findMany({
      where: { memberId },
      include: { coachPersona: true },
    });

    const completedSessions = sessions.filter(s => s.endedAt !== null);
    const totalSessions = completedSessions.length;

    let totalDuration = 0;
    const coachUsage: Record<string, { name: string; count: number }> = {};

    for (const session of completedSessions) {
      if (session.startedAt && session.endedAt) {
        const duration = (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60);
        totalDuration += duration;
      }

      const coachId = session.coachPersonaId;
      if (!coachUsage[coachId]) {
        coachUsage[coachId] = { name: session.coachPersona.name, count: 0 };
      }
      coachUsage[coachId].count++;
    }

    const mostUsedCoachEntry = Object.entries(coachUsage).sort((a, b) => b[1].count - a[1].count)[0];
    const mostUsedCoach = mostUsedCoachEntry ? {
      id: mostUsedCoachEntry[0],
      name: mostUsedCoachEntry[1].name,
      sessionCount: mostUsedCoachEntry[1].count,
    } : undefined;

    // Goal stats
    const goals = await prisma.coachingGoal.findMany({ where: { memberId } });
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
    const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Reflection stats
    const reflections = await prisma.reflection.findMany({ where: { memberId } });
    const totalReflections = reflections.length;

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = await this.getRecentActivity(memberId, thirtyDaysAgo);

    // Calculate streak
    const streakDays = await this.calculateStreak(memberId);

    return {
      memberId,
      totalSessions,
      totalGoals,
      completedGoals,
      totalReflections,
      averageSessionDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      mostUsedCoach,
      recentActivity,
      goalCompletionRate,
      streakDays,
    };
  }

  private async getRecentActivity(memberId: string, since: Date) {
    const sessions = await prisma.coachingSession.findMany({
      where: {
        memberId,
        createdAt: { gte: since },
      },
    });

    const reflections = await prisma.reflection.findMany({
      where: {
        memberId,
        createdAt: { gte: since },
      },
    });

    const goals = await prisma.coachingGoal.findMany({
      where: {
        memberId,
        updatedAt: { gte: since },
      },
    });

    // Group by date
    const activityByDate: Record<string, { sessions: number; reflections: number; goalsProgress: number }> = {};

    for (const session of sessions) {
      const date = session.createdAt.toISOString().split('T')[0];
      if (!activityByDate[date]) {
        activityByDate[date] = { sessions: 0, reflections: 0, goalsProgress: 0 };
      }
      activityByDate[date].sessions++;
    }

    for (const reflection of reflections) {
      const date = reflection.createdAt.toISOString().split('T')[0];
      if (!activityByDate[date]) {
        activityByDate[date] = { sessions: 0, reflections: 0, goalsProgress: 0 };
      }
      activityByDate[date].reflections++;
    }

    for (const goal of goals) {
      const date = goal.updatedAt.toISOString().split('T')[0];
      if (!activityByDate[date]) {
        activityByDate[date] = { sessions: 0, reflections: 0, goalsProgress: 0 };
      }
      activityByDate[date].goalsProgress++;
    }

    return Object.entries(activityByDate).map(([date, data]) => ({
      date,
      ...data,
    })).sort((a, b) => b.date.localeCompare(a.date));
  }

  private async calculateStreak(memberId: string): Promise<number> {
    const activities = await prisma.reflection.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (activities.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(activities[0].createdAt);
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 1; i < activities.length; i++) {
      const activityDate = new Date(activities[i].createdAt);
      activityDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        streak++;
        currentDate = activityDate;
      } else if (daysDiff > 1) {
        break;
      }
    }

    return streak;
  }
}

export const analyticsService = new AnalyticsService();
