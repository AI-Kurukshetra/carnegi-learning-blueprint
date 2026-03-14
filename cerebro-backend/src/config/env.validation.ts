import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required(),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().required(),

  // AI / Gemini
  GEMINI_API_KEY: Joi.string().required(),
  AI_QUESTION_GEN_MODEL: Joi.string().default('gemini-2.5-flash'),
  AI_HINT_MODEL: Joi.string().default('gemini-2.5-flash'),
  AI_GRADING_MODEL: Joi.string().default('gemini-2.5-flash'),
  AI_MAX_RETRIES: Joi.number().default(3),
  AI_TIMEOUT_MS: Joi.number().default(120000),

  // Razorpay
  RAZORPAY_KEY_ID: Joi.string().required(),
  RAZORPAY_KEY_SECRET: Joi.string().required(),
});
