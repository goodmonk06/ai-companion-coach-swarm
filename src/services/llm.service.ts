import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { Message, CoachConfig } from '../types';

export class LLMService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Generate a coaching response based on the conversation context
   */
  async generateCoachingResponse(
    coachName: string,
    styleDescription: string,
    config: CoachConfig,
    conversationHistory: Message[],
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(coachName, styleDescription, config);

    // Convert messages to Anthropic format
    const messages = conversationHistory
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: config.maxTokens || 1000,
        temperature: config.temperature || 0.7,
        system: systemPrompt,
        messages,
      });

      const textContent = response.content.find((c) => c.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Error generating coaching response:', error);
      throw new Error('Failed to generate coaching response');
    }
  }

  /**
   * Generate a session summary and action items
   */
  async generateSessionSummary(
    conversationHistory: Message[],
  ): Promise<{ summary: string; actionItems: string }> {
    const systemPrompt = `You are an expert at analyzing coaching conversations and creating concise summaries with actionable next steps.

Your task:
1. Summarize the key themes, insights, and breakthroughs from the conversation
2. Extract concrete action items that were discussed or implied

Format your response as JSON with this structure:
{
  "summary": "Markdown-formatted summary (2-4 paragraphs)",
  "actionItems": [
    {
      "title": "Brief action title",
      "description": "What needs to be done",
      "priority": "low|medium|high"
    }
  ]
}`;

    const conversationText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Please analyze this coaching conversation and provide a summary with action items:\n\n${conversationText}`,
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      const text = textContent && 'text' in textContent ? textContent.text : '{}';

      // Extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

      const parsed = JSON.parse(jsonText);
      return {
        summary: parsed.summary || '',
        actionItems: JSON.stringify(parsed.actionItems || []),
      };
    } catch (error) {
      console.error('Error generating session summary:', error);
      throw new Error('Failed to generate session summary');
    }
  }

  /**
   * Generate an initial greeting message from the coach
   */
  async generateGreeting(coachName: string, styleDescription: string): Promise<string> {
    const systemPrompt = `You are ${coachName}, an AI coach. ${styleDescription}

Create a warm, welcoming greeting (2-3 sentences) to start a coaching session. Introduce yourself briefly and invite the person to share what's on their mind.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: 'Please greet me and start our coaching session.',
          },
        ],
      });

      const textContent = response.content.find((c) => c.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Error generating greeting:', error);
      throw new Error('Failed to generate greeting');
    }
  }

  private buildSystemPrompt(
    coachName: string,
    styleDescription: string,
    config: CoachConfig,
  ): string {
    const basePrompt = `You are ${coachName}, an AI coaching companion.

${styleDescription}

Guidelines for your coaching style:
- Ask thoughtful, open-ended questions to deepen understanding
- Listen actively and reflect back what you hear
- Help identify patterns, insights, and action steps
- Be authentic, warm, and professional
- Keep responses focused and conversational (2-4 paragraphs typically)
- Avoid being preachy or overly prescriptive
- Remember that you're a companion on their journey, not an authority figure

${config.systemPromptAddition || ''}`;

    return basePrompt;
  }
}

// Singleton instance
export const llmService = new LLMService();
