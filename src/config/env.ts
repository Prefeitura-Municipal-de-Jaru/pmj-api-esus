import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DB_HOST: z.string().min(1, 'DB_HOST e obrigatorio'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1, 'DB_NAME e obrigatorio'),
  DB_USER: z.string().min(1, 'DB_USER e obrigatorio'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD e obrigatorio'),
  DB_SSL: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  UNIDADES_IDS: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') return [];
      return val
        .split(',')
        .map((id) => parseInt(id.trim(), 10))
        .filter((id) => !Number.isNaN(id));
    }),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().default(600),
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Falha na validacao das variaveis de ambiente:\n${issues}`);
}

export const env = parsed.data;
