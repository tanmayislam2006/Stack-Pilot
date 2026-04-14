import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });
interface EnvConfig {
  DATABASE_URL: string;
  PORT: string;
  NODE_ENV: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  FRONTEND_URL: string;
}
const loadedEnvConfig = (): EnvConfig => {
  const requireEnvVariables = [
    'PORT',
    'NODE_ENV',
    'DATABASE_URL',
    'BETTER_AUTH_SECRET',
    'BETTER_AUTH_URL',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'FRONTEND_URL',
  ];

  requireEnvVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(
        `Environment variable ${envVar} is required but not set in .env file.`,
      );
    }
  });

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    FRONTEND_URL: process.env.FRONTEND_URL!,
  };
};

export const envVars = loadedEnvConfig();
