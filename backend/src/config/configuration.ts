export const env = {
  production:
    process.env.APP_ENV === 'production' ||
    process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  apiKeyEncKey: process.env.API_KEY_ENC_KEY || '',
  corsOrigins: [
    'http://localhost:5173',
    'https://app-rendria.vercel.app',
    'https://app.rendria.com',
    'https://rendria.com',
    ...(process.env.CORS_ORIGINS || '').split(','),
  ]
    .map((origin) => origin.trim())
    .filter(Boolean),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  samRenderUrl: process.env.SAM_RENDER_URL || 'http://127.0.0.1:3000',
  awsRegion: process.env.AWS_REGION,
  renderLambdaName: process.env.RENDER_LAMBDA_NAME,
  apiBaseUrl:
    process.env.API_BASE_URL ||
    (process.env.APP_ENV === 'production' ||
    process.env.NODE_ENV === 'production'
      ? 'https://rendria-backend.vercel.app'
      : 'http://localhost:5000'),
  googleSheetTemplateUrl:
    process.env.GOOGLE_SHEET_TEMPLATE_URL ||
    'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/copy',
  lemonApiKey:
    process.env.LEMONSQUEEZY_API_KEY || process.env.LEMONSQUEESY_TEST_API_KEY,
  lemonWebhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
  lemonStoreId: process.env.LEMONSQUEEZY_STORE_ID,
  starterVariantId: process.env.PRODUCT_STARTER_ID,
  premiumVariantId: process.env.PRODUCT_PREMIUM_ID,
};
