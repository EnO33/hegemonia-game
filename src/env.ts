import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

function validateEnv() {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const formatted = parsed.error.format()
    const missing = Object.entries(formatted)
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => {
        const errors = '_errors' in value ? value._errors : []
        return `  - ${key}: ${errors.join(', ')}`
      })
      .join('\n')

    throw new Error(`Environment validation failed:\n${missing}`)
  }

  return parsed.data
}

export const env = validateEnv()

export type Env = z.infer<typeof envSchema>
