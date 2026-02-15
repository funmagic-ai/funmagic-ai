import { OpenAPIHono } from '@hono/zod-openapi';
import { projectsRoutes } from './projects';
import { generationsRoutes } from './generations';
import { providersRoutes } from './providers';
import { assetsRoutes } from './assets';
import { batchRoutes } from './batch';

export const studioRoutes = new OpenAPIHono<{ Variables: { user: { id: string } } }>()
  .route('/', projectsRoutes)
  .route('/', generationsRoutes)
  .route('/', providersRoutes)
  .route('/', assetsRoutes)
  .route('/', batchRoutes);
