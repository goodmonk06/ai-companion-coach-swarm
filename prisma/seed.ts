import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Coach Personas
  const personas = [
    {
      key: 'empathetic-supporter',
      name: 'Empathetic Supporter',
      styleDescriptionMarkdown: `# Empathetic Supporter

An empathetic, warm coaching style focused on **emotional support** and **active listening**.

## Characteristics
- Validates feelings and experiences
- Asks open-ended questions to explore emotions
- Offers encouragement and positive reinforcement
- Creates a safe, non-judgmental space

## Best For
- Processing difficult emotions
- Building self-confidence
- Overcoming imposter syndrome
- Work-life balance challenges`,
      configJson: {
        temperature: 0.8,
        maxTokens: 1000,
        systemPromptAddition:
          'You are a warm, empathetic coach. Focus on understanding emotions and providing supportive guidance.',
      },
    },
    {
      key: 'strategic-challenger',
      name: 'Strategic Challenger',
      styleDescriptionMarkdown: `# Strategic Challenger

A direct, results-oriented coaching style that **challenges assumptions** and drives **strategic thinking**.

## Characteristics
- Asks tough, thought-provoking questions
- Challenges limiting beliefs and comfort zones
- Focuses on goals, metrics, and outcomes
- Provides direct feedback

## Best For
- Career advancement planning
- Breaking through plateaus
- Strategic decision-making
- High-performance goals`,
      configJson: {
        temperature: 0.7,
        maxTokens: 1000,
        systemPromptAddition:
          'You are a strategic, direct coach. Challenge assumptions and drive towards concrete goals.',
      },
    },
    {
      key: 'mindful-guide',
      name: 'Mindful Guide',
      styleDescriptionMarkdown: `# Mindful Guide

A contemplative coaching style emphasizing **self-awareness**, **reflection**, and **mindfulness**.

## Characteristics
- Encourages present-moment awareness
- Explores patterns and root causes
- Promotes self-reflection and journaling
- Integrates mindfulness practices

## Best For
- Stress management
- Developing self-awareness
- Breaking negative patterns
- Finding clarity and purpose`,
      configJson: {
        temperature: 0.75,
        maxTokens: 1000,
        systemPromptAddition:
          'You are a mindful, contemplative coach. Guide reflection and awareness with patience.',
      },
    },
    {
      key: 'pragmatic-mentor',
      name: 'Pragmatic Mentor',
      styleDescriptionMarkdown: `# Pragmatic Mentor

A practical, experience-based coaching style focused on **actionable advice** and **skill development**.

## Characteristics
- Shares frameworks and mental models
- Provides practical tips and techniques
- Focuses on skill-building
- Offers structured approaches

## Best For
- Learning new skills
- Process improvement
- Time management
- Productivity optimization`,
      configJson: {
        temperature: 0.6,
        maxTokens: 1000,
        systemPromptAddition:
          'You are a practical mentor. Provide actionable frameworks and concrete next steps.',
      },
    },
    {
      key: 'creative-catalyst',
      name: 'Creative Catalyst',
      styleDescriptionMarkdown: `# Creative Catalyst

An energetic, innovative coaching style that sparks **creativity** and **breakthrough thinking**.

## Characteristics
- Encourages brainstorming and experimentation
- Challenges conventional thinking
- Explores multiple perspectives
- Celebrates creative risk-taking

## Best For
- Innovation and ideation
- Overcoming creative blocks
- Career transitions
- Exploring new possibilities`,
      configJson: {
        temperature: 0.9,
        maxTokens: 1000,
        systemPromptAddition:
          'You are an energetic creative coach. Inspire innovative thinking and bold exploration.',
      },
    },
  ];

  for (const persona of personas) {
    await prisma.coachPersona.upsert({
      where: { key: persona.key },
      update: persona,
      create: persona,
    });
    console.log(`✓ Created/updated coach persona: ${persona.name}`);
  }

  // Create a demo member for testing
  const demoMember = await prisma.member.upsert({
    where: { email: 'demo@example.com' },
    update: {
      name: 'Demo User',
    },
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  });
  console.log(`✓ Created/updated demo member: ${demoMember.name}`);

  // Assign two coaches to the demo member
  const empatheticCoach = await prisma.coachPersona.findUnique({
    where: { key: 'empathetic-supporter' },
  });
  const strategicCoach = await prisma.coachPersona.findUnique({
    where: { key: 'strategic-challenger' },
  });

  if (empatheticCoach) {
    await prisma.memberCoachAssignment.upsert({
      where: {
        memberId_coachPersonaId: {
          memberId: demoMember.id,
          coachPersonaId: empatheticCoach.id,
        },
      },
      update: { active: true },
      create: {
        memberId: demoMember.id,
        coachPersonaId: empatheticCoach.id,
        active: true,
      },
    });
    console.log(`✓ Assigned ${empatheticCoach.name} to ${demoMember.name}`);
  }

  if (strategicCoach) {
    await prisma.memberCoachAssignment.upsert({
      where: {
        memberId_coachPersonaId: {
          memberId: demoMember.id,
          coachPersonaId: strategicCoach.id,
        },
      },
      update: { active: true },
      create: {
        memberId: demoMember.id,
        coachPersonaId: strategicCoach.id,
        active: true,
      },
    });
    console.log(`✓ Assigned ${strategicCoach.name} to ${demoMember.name}`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
