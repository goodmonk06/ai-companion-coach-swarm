import { prisma } from '../lib/prisma';

export class CoachService {
  /**
   * Get all coach personas
   */
  async getAllCoaches() {
    return prisma.coachPersona.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get a specific coach persona
   */
  async getCoach(id: string) {
    const coach = await prisma.coachPersona.findUnique({
      where: { id },
    });

    if (!coach) {
      throw new Error('Coach persona not found');
    }

    return coach;
  }

  /**
   * Get coaches assigned to a member
   */
  async getMemberCoaches(memberId: string) {
    const assignments = await prisma.memberCoachAssignment.findMany({
      where: {
        memberId,
        active: true,
      },
      include: {
        coachPersona: true,
      },
    });

    return assignments.map((assignment) => assignment.coachPersona);
  }

  /**
   * Assign a coach to a member
   */
  async assignCoachToMember(memberId: string, coachPersonaId: string) {
    // Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    // Verify coach exists
    const coach = await prisma.coachPersona.findUnique({
      where: { id: coachPersonaId },
    });

    if (!coach) {
      throw new Error('Coach persona not found');
    }

    // Create or update assignment
    const assignment = await prisma.memberCoachAssignment.upsert({
      where: {
        memberId_coachPersonaId: {
          memberId,
          coachPersonaId,
        },
      },
      update: {
        active: true,
      },
      create: {
        memberId,
        coachPersonaId,
        active: true,
      },
      include: {
        coachPersona: true,
      },
    });

    return assignment;
  }

  /**
   * Unassign a coach from a member
   */
  async unassignCoachFromMember(memberId: string, coachPersonaId: string) {
    const assignment = await prisma.memberCoachAssignment.findUnique({
      where: {
        memberId_coachPersonaId: {
          memberId,
          coachPersonaId,
        },
      },
    });

    if (!assignment) {
      throw new Error('Coach assignment not found');
    }

    await prisma.memberCoachAssignment.update({
      where: {
        memberId_coachPersonaId: {
          memberId,
          coachPersonaId,
        },
      },
      data: {
        active: false,
      },
    });

    return { success: true };
  }
}

export const coachService = new CoachService();
