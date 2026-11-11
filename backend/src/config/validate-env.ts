import { env } from './configuration';

export function assertRuntimeConfig(): void {
  if (!env.databaseUrl || !env.jwtSecret || !env.apiKeyEncKey) {
    throw new Error(
      'DATABASE_URL, JWT_SECRET and API_KEY_ENC_KEY are required',
    );
  }
  if (Buffer.from(env.apiKeyEncKey, 'base64').length !== 32) {
    throw new Error('API_KEY_ENC_KEY must be base64 encoded 32 bytes');
  }
  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error('PORT must be a valid port number');
  }
  if (env.production && (!env.awsRegion || !env.renderLambdaName)) {
    throw new Error(
      'AWS_REGION and RENDER_LAMBDA_NAME are required in production',
    );
  }
  if (
    env.production &&
    (!env.cloudinary.cloudName ||
      !env.cloudinary.apiKey ||
      !env.cloudinary.apiSecret)
  ) {
    throw new Error(
      'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required in production',
    );
  }
  if (
    env.production &&
    (!env.lemonApiKey ||
      !env.lemonWebhookSecret ||
      !env.lemonStoreId ||
      !env.starterVariantId ||
      !env.premiumVariantId)
  ) {
    throw new Error(
      'Lemon Squeezy API, webhook, store and both product variant settings are required in production',
    );
  }
}
