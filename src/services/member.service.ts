import { prisma } from '../lib/prisma';

export class MemberService {
  /**
   * Create a new member
   */
  async createMember(email: string, name: string) {
    // Check if member already exists
    const existing = await prisma.member.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('Member with this email already exists');
    }

    return prisma.member.create({
      data: {
        email,
        name,
      },
    });
  }

  /**
   * Get a member by ID
   */
  async getMember(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        coachAssignments: {
          where: { active: true },
          include: {
            coachPersona: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    return member;
  }

  /**
   * Get member by email
   */
  async getMemberByEmail(email: string) {
    const member = await prisma.member.findUnique({
      where: { email },
      include: {
        coachAssignments: {
          where: { active: true },
          include: {
            coachPersona: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    return member;
  }

  /**
   * Get all members
   */
  async getAllMembers() {
    return prisma.member.findMany({
      include: {
        coachAssignments: {
          where: { active: true },
          include: {
            coachPersona: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update member
   */
  async updateMember(id: string, data: { name?: string; email?: string }) {
    return prisma.member.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete member
   */
  async deleteMember(id: string) {
    await prisma.member.delete({
      where: { id },
    });

    return { success: true };
  }
}

export const memberService = new MemberService();
