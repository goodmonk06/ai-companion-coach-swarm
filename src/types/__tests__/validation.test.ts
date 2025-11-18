import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Type Validation', () => {
  describe('Message schema', () => {
    const messageSchema = z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1),
      timestamp: z.string(),
    });

    it('should validate a valid message', () => {
      const validMessage = {
        role: 'user',
        content: 'Hello coach!',
        timestamp: new Date().toISOString(),
      };

      expect(() => messageSchema.parse(validMessage)).not.toThrow();
    });

    it('should reject invalid role', () => {
      const invalidMessage = {
        role: 'invalid',
        content: 'Hello',
        timestamp: new Date().toISOString(),
      };

      expect(() => messageSchema.parse(invalidMessage)).toThrow();
    });

    it('should reject empty content', () => {
      const invalidMessage = {
        role: 'user',
        content: '',
        timestamp: new Date().toISOString(),
      };

      expect(() => messageSchema.parse(invalidMessage)).toThrow();
    });
  });

  describe('ActionItem schema', () => {
    const actionItemSchema = z.object({
      title: z.string().min(1),
      description: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      dueDate: z.string().optional(),
      completed: z.boolean().optional(),
    });

    it('should validate a valid action item', () => {
      const validItem = {
        title: 'Complete project',
        description: 'Finish the coaching swarm implementation',
        priority: 'high',
      };

      expect(() => actionItemSchema.parse(validItem)).not.toThrow();
    });

    it('should accept optional fields', () => {
      const itemWithOptionals = {
        title: 'Review code',
        description: 'Review the PR',
        priority: 'medium',
        dueDate: '2024-12-31',
        completed: false,
      };

      expect(() => actionItemSchema.parse(itemWithOptionals)).not.toThrow();
    });
  });
});
