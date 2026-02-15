import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type DbInstance = ReturnType<typeof drizzle<typeof schema>>;
type QueryClient = ReturnType<typeof postgres>;

// Use globalThis to persist across HMR in development and serverless invocations
const globalForDb = globalThis as unknown as {
  queryClient: QueryClient | undefined;
  db: DbInstance | undefined;
};

function createDb(): DbInstance {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const queryClient = postgres(connectionString, {
    max: 50, // Maximum pool size (increased for concurrent admin requests)
    idle_timeout: 60, // Close idle connections after 60 seconds
    connect_timeout: 10, // Connection timeout in seconds
    max_lifetime: 60 * 5, // Close connections after 5 minutes
    prepare: false, // Disable prepared statements for serverless compatibility
  });

  return drizzle(queryClient, { schema });
}

// Create singleton instance
export const db = globalForDb.db ?? createDb();

// Persist in development to survive HMR
if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

// Export schema and types
export * from './schema';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
