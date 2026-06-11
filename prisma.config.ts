import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration. Connection URLs live here (not in the schema) so the
 * Migrate engine can reach PostgreSQL, while the runtime PrismaClient connects
 * through the `@prisma/adapter-pg` driver adapter.
 */
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
