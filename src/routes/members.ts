import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { memberService } from '../services/member.service';

const createMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const members: FastifyPluginAsync = async (fastify) => {
  // Get all members
  fastify.get('/', async (_request, reply) => {
    try {
      const members = await memberService.getAllMembers();
      return reply.send(members);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(500).send({
          error: error.message,
        });
      }
      throw error;
    }
  });

  // Create a new member
  fastify.post('/', async (request, reply) => {
    try {
      const body = createMemberSchema.parse(request.body);
      const member = await memberService.createMember(body.email, body.name);
      return reply.code(201).send(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }

      throw error;
    }
  });

  // Get a specific member
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const member = await memberService.getMember(id);
      return reply.send(member);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({
          error: error.message,
        });
      }
      throw error;
    }
  });

  // Get member by email
  fastify.get('/email/:email', async (request, reply) => {
    try {
      const { email } = request.params as { email: string };
      const member = await memberService.getMemberByEmail(email);
      return reply.send(member);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({
          error: error.message,
        });
      }
      throw error;
    }
  });

  // Update a member
  fastify.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = updateMemberSchema.parse(request.body);
      const member = await memberService.updateMember(id, body);
      return reply.send(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        return reply.code(400).send({
          error: error.message,
        });
      }

      throw error;
    }
  });

  // Delete a member
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const result = await memberService.deleteMember(id);
      return reply.send(result);
    } catch (error) {
      if (error instanceof Error) {
        return reply.code(404).send({
          error: error.message,
        });
      }
      throw error;
    }
  });
};

export default members;
