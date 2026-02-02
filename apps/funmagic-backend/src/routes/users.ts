import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { UserMeSchema } from '../schemas';

const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Users'],
  responses: {
    200: {
      content: { 'application/json': { schema: UserMeSchema } },
      description: 'Current user info',
    },
  },
});

export const usersRoutes = new OpenAPIHono()
  .openapi(getMeRoute, (c) => c.json({ message: 'TODO: get current user' }));
