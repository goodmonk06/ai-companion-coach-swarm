import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enhanced database seeding...\n');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Clearing existing data...');
    await prisma.sessionTag.deleteMany();
    await prisma.goalTag.deleteMany();
    await prisma.reflectionTag.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.reflection.deleteMany();
    await prisma.coachingGoal.deleteMany();
    await prisma.coachingSession.deleteMany();
    await prisma.memberCoachAssignment.deleteMany();
    await prisma.sessionTemplate.deleteMany();
    await prisma.memberPreferences.deleteMany();
    await prisma.member.deleteMany();
    await prisma.coachPersona.deleteMany();
    console.log('✓ Existing data cleared\n');
  }

  //================================================
  // 1. COACH PERSONAS
  //================================================
  console.log('👥 Seeding coach personas...');

  const personas = [
    {
      key: 'empathetic-supporter',
      name: 'Empathetic Supporter',
      styleDescriptionMarkdown: `# Empathetic Supporter\nAn empathetic, warm coaching style focused on **emotional support** and **active listening**.`,
      configJson: { temperature: 0.8, maxTokens: 1000 },
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=empathetic',
      specialties: ['emotional-support', 'confidence-building', 'work-life-balance'],
    },
    {
      key: 'strategic-challenger',
      name: 'Strategic Challenger',
      styleDescriptionMarkdown: `# Strategic Challenger\nA direct, results-oriented coaching style that **challenges assumptions** and drives **strategic thinking**.`,
      configJson: { temperature: 0.7, maxTokens: 1000 },
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=strategic',
      specialties: ['career-advancement', 'goal-setting', 'decision-making'],
    },
    {
      key: 'mindful-guide',
      name: 'Mindful Guide',
      styleDescriptionMarkdown: `# Mindful Guide\nA contemplative coaching style emphasizing **self-awareness**, **reflection**, and **mindfulness**.`,
      configJson: { temperature: 0.75, maxTokens: 1000 },
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mindful',
      specialties: ['stress-management', 'self-awareness', 'mindfulness'],
    },
    {
      key: 'pragmatic-mentor',
      name: 'Pragmatic Mentor',
      styleDescriptionMarkdown: `# Pragmatic Mentor\nA practical, experience-based coaching style focused on **actionable advice** and **skill development**.`,
      configJson: { temperature: 0.6, maxTokens: 1000 },
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pragmatic',
      specialties: ['productivity', 'time-management', 'skill-building'],
    },
    {
      key: 'creative-catalyst',
      name: 'Creative Catalyst',
      styleDescriptionMarkdown: `# Creative Catalyst\nAn energetic, innovative coaching style that sparks **creativity** and **breakthrough thinking**.`,
      configJson: { temperature: 0.9, maxTokens: 1000 },
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creative',
      specialties: ['innovation', 'creative-thinking', 'problem-solving'],
    },
  ];

  const createdPersonas: Record<string, any> = {};
  for (const persona of personas) {
    const created = await prisma.coachPersona.upsert({
      where: { key: persona.key },
      update: persona,
      create: persona,
    });
    createdPersonas[persona.key] = created;
    console.log(`  ✓ ${created.name}`);
  }
  console.log('');

  //================================================
  // 2. MEMBERS
  //================================================
  console.log('🧑 Seeding members...');

  const members = [
    { email: 'demo@example.com', name: 'Demo User', bio: 'Exploring personal growth and career development', timezone: 'America/Los_Angeles' },
    { email: 'alex.career@example.com', name: 'Alex Chen', bio: 'Software engineer aiming for tech lead role', timezone: 'America/New_York' },
    { email: 'maria.wellness@example.com', name: 'Maria Garcia', bio: 'Marketing manager focusing on work-life balance', timezone: 'Europe/Madrid' },
    { email: 'jordan.creative@example.com', name: 'Jordan Kim', bio: 'Product designer seeking innovation breakthroughs', timezone: 'Asia/Tokyo' },
    { email: 'sam.strategic@example.com', name: 'Sam Patel', bio: 'Entrepreneur scaling a startup', timezone: 'America/Chicago' },
  ];

  const createdMembers: any[] = [];
  for (const member of members) {
    const created = await prisma.member.upsert({
      where: { email: member.email },
      update: member,
      create: member,
    });
    createdMembers.push(created);
    console.log(`  ✓ ${created.name}`);

    // Create preferences
    await prisma.memberPreferences.upsert({
      where: { memberId: created.id },
      update: {},
      create: {
        memberId: created.id,
        notificationsEnabled: true,
        emailDigestFrequency: 'weekly',
        defaultSessionDuration: 30,
        privacyLevel: 'private',
      },
    });
  }
  console.log('');

  //================================================
  // 3. COACH ASSIGNMENTS
  //================================================
  console.log('🔗 Creating coach assignments...');

  const assignments = [
    { member: createdMembers[0], coaches: ['empathetic-supporter', 'strategic-challenger'] },
    { member: createdMembers[1], coaches: ['strategic-challenger', 'pragmatic-mentor'] },
    { member: createdMembers[2], coaches: ['empathetic-supporter', 'mindful-guide'] },
    { member: createdMembers[3], coaches: ['creative-catalyst', 'mindful-guide'] },
    { member: createdMembers[4], coaches: ['strategic-challenger', 'creative-catalyst', 'pragmatic-mentor'] },
  ];

  for (const assignment of assignments) {
    for (const coachKey of assignment.coaches) {
      await prisma.memberCoachAssignment.upsert({
        where: {
          memberId_coachPersonaId: {
            memberId: assignment.member.id,
            coachPersonaId: createdPersonas[coachKey].id,
          },
        },
        update: { active: true },
        create: {
          memberId: assignment.member.id,
          coachPersonaId: createdPersonas[coachKey].id,
          active: true,
        },
      });
    }
    console.log(`  ✓ Assigned coaches to ${assignment.member.name}`);
  }
  console.log('');

  //================================================
  // 4. TAGS
  //================================================
  console.log('🏷️  Creating tags...');

  const tagData = [
    { name: 'career', color: '#3B82F6', category: 'goal' },
    { name: 'wellness', color: '#10B981', category: 'goal' },
    { name: 'productivity', color: '#F59E0B', category: 'skill' },
    { name: 'leadership', color: '#8B5CF6', category: 'skill' },
    { name: 'creativity', color: '#EC4899', category: 'skill' },
    { name: 'stress', color: '#EF4444', category: 'emotion' },
    { name: 'grateful', color: '#34D399', category: 'emotion' },
    { name: 'motivated', color: '#60A5FA', category: 'emotion' },
    { name: 'breakthrough', color: '#FBBF24', category: 'milestone' },
    { name: 'challenge', color: '#F87171', category: 'milestone' },
  ];

  const createdTags: Record<string, any> = {};
  for (const tag of tagData) {
    const created = await prisma.tag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    });
    createdTags[tag.name] = created;
    console.log(`  ✓ ${tag.name}`);
  }
  console.log('');

  //================================================
  // 5. SESSION TEMPLATES
  //================================================
  console.log('📋 Creating session templates...');

  const templates = [
    {
      key: 'career-goal-setting',
      title: 'Career Goal Setting Session',
      description: 'A structured session to define and plan your career goals',
      category: 'career',
      coachPersonaId: createdPersonas['strategic-challenger'].id,
      promptsJson: [
        { order: 0, text: 'What are your top 3 career aspirations for the next year?', type: 'question' },
        { order: 1, text: 'For each aspiration, what specific skills do you need to develop?', type: 'question' },
        { order: 2, text: 'What obstacles might prevent you from achieving these goals?', type: 'reflection' },
        { order: 3, text: 'Create a 90-day action plan for your top priority goal', type: 'action' },
      ],
      estimatedDuration: 45,
      difficulty: 'intermediate',
    },
    {
      key: 'stress-management',
      title: 'Stress Management & Mindfulness',
      description: 'A calming session to identify stress sources and develop coping strategies',
      category: 'wellness',
      coachPersonaId: createdPersonas['mindful-guide'].id,
      promptsJson: [
        { order: 0, text: 'What are your current main sources of stress?', type: 'question' },
        { order: 1, text: 'How does stress manifest in your body and mind?', type: 'reflection' },
        { order: 2, text: 'What activities help you feel calm and centered?', type: 'question' },
        { order: 3, text: 'Design a daily mindfulness practice that fits your schedule', type: 'action' },
      ],
      estimatedDuration: 30,
      difficulty: 'beginner',
    },
    {
      key: 'weekly-reflection',
      title: 'Weekly Reflection & Planning',
      description: 'Review your week and plan for the week ahead',
      category: 'productivity',
      coachPersonaId: createdPersonas['pragmatic-mentor'].id,
      promptsJson: [
        { order: 0, text: 'What were your biggest wins this week?', type: 'reflection' },
        { order: 1, text: 'What challenges did you face and how did you handle them?', type: 'reflection' },
        { order: 2, text: 'What are your top 3 priorities for next week?', type: 'question' },
        { order: 3, text: 'Time-block your calendar for these priorities', type: 'action' },
      ],
      estimatedDuration: 20,
      difficulty: 'beginner',
    },
  ];

  for (const template of templates) {
    await prisma.sessionTemplate.upsert({
      where: { key: template.key },
      update: template,
      create: template,
    });
    console.log(`  ✓ ${template.title}`);
  }
  console.log('');

  //================================================
  // 6. GOALS
  //================================================
  console.log('🎯 Creating goals...');

  const goals = [
    {
      memberId: createdMembers[1].id,
      coachPersonaId: createdPersonas['strategic-challenger'].id,
      title: 'Become a Tech Lead within 12 months',
      description: 'Lead a team of 3-5 engineers and drive architectural decisions',
      status: 'ACTIVE',
      priority: 'HIGH',
      progress: 35,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      milestonesJson: [
        { id: uuidv4(), title: 'Complete leadership training', description: 'Finish 3-month leadership course', completed: true, completedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuidv4(), title: 'Mentor 2 junior developers', description: 'Establish regular 1-on-1s', completed: false },
        { id: uuidv4(), title: 'Present at tech conference', description: 'Submit CFP and deliver talk', completed: false },
      ],
      tags: ['career', 'leadership'],
    },
    {
      memberId: createdMembers[2].id,
      coachPersonaId: createdPersonas['mindful-guide'].id,
      title: 'Establish work-life boundaries',
      description: 'No work emails after 7pm and weekend self-care routine',
      status: 'ACTIVE',
      priority: 'HIGH',
      progress: 60,
      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      milestonesJson: [
        { id: uuidv4(), title: 'Set up email auto-responder', completed: true, completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuidv4(), title: 'Morning meditation practice', description: '10min daily', completed: false },
      ],
      tags: ['wellness', 'stress'],
    },
    {
      memberId: createdMembers[3].id,
      coachPersonaId: createdPersonas['creative-catalyst'].id,
      title: 'Launch innovative design system',
      description: 'Create and implement a company-wide design system',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      progress: 45,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      milestonesJson: [
        { id: uuidv4(), title: 'Research best practices', completed: true, completedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuidv4(), title: 'Build component library', completed: false },
        { id: uuidv4(), title: 'Get stakeholder buy-in', completed: false },
      ],
      tags: ['creativity', 'career'],
    },
    {
      memberId: createdMembers[4].id,
      coachPersonaId: createdPersonas['strategic-challenger'].id,
      title: 'Achieve product-market fit',
      description: 'Reach 1000 active users with 40% retention',
      status: 'ACTIVE',
      priority: 'HIGH',
      progress: 25,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      milestonesJson: [
        { id: uuidv4(), title: '100 users milestone', completed: true, completedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
        { id: uuidv4(), title: '500 users milestone', completed: false },
        { id: uuidv4(), title: 'Implement referral program', completed: false },
      ],
      tags: ['career', 'challenge'],
    },
  ];

  for (const goalData of goals) {
    const { tags, ...goalFields } = goalData;
    const goal = await prisma.coachingGoal.create({
      data: goalFields,
    });

    // Add tags
    for (const tagName of tags) {
      await prisma.goalTag.create({
        data: {
          goalId: goal.id,
          tagId: createdTags[tagName].id,
          memberId: goal.memberId,
        },
      });
    }

    console.log(`  ✓ ${goal.title}`);
  }
  console.log('');

  //================================================
  // 7. REFLECTIONS
  //================================================
  console.log('💭 Creating reflections...');

  const reflections = [
    {
      memberId: createdMembers[0].id,
      title: 'Great conversation with my manager',
      content: 'Had a productive 1-on-1 today. My manager sees my potential and wants to support my growth. Feeling encouraged!',
      mood: 'motivated',
      tags: ['grateful', 'career'],
    },
    {
      memberId: createdMembers[1].id,
      content: 'Struggling with imposter syndrome as I step into more leadership responsibilities. Need to remember my wins and trust my abilities.',
      mood: 'stressed',
      tags: ['stress', 'leadership'],
    },
    {
      memberId: createdMembers[2].id,
      title: 'Weekend reset',
      content: 'Took a complete digital detox this weekend. Spent time in nature, read a book, and feel so much more energized. This needs to become a habit.',
      mood: 'energized',
      tags: ['grateful', 'wellness'],
    },
    {
      memberId: createdMembers[3].id,
      title: 'Design breakthrough!',
      content: 'Finally cracked the navigation problem I\'ve been wrestling with for weeks. Sometimes you need to step away and let your subconscious work.',
      mood: 'excited',
      tags: ['breakthrough', 'creativity'],
    },
    {
      memberId: createdMembers[4].id,
      content: 'User feedback session today was tough but valuable. Need to pivot our positioning strategy. This is the hard part of building a startup.',
      mood: 'determined',
      tags: ['challenge', 'career'],
    },
  ];

  for (const reflectionData of reflections) {
    const { tags, ...reflectionFields } = reflectionData;
    const reflection = await prisma.reflection.create({
      data: reflectionFields,
    });

    // Add tags
    for (const tagName of tags) {
      await prisma.reflectionTag.create({
        data: {
          reflectionId: reflection.id,
          tagId: createdTags[tagName].id,
          memberId: reflection.memberId,
        },
      });
    }

    console.log(`  ✓ ${reflection.title || reflection.content.substring(0, 50) + '...'}`);
  }
  console.log('');

  console.log('🎉 Enhanced seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`  - ${personas.length} coach personas`);
  console.log(`  - ${members.length} members`);
  console.log(`  - ${templates.length} session templates`);
  console.log(`  - ${goals.length} goals`);
  console.log(`  - ${reflections.length} reflections`);
  console.log(`  - ${tagData.length} tags`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
