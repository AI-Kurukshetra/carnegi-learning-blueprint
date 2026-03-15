import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';

export interface AiRequest {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  tenantId: string;
  userId: string;
  feature: 'question_generation' | 'hint_generation' | 'grading' | 'student_insight' | 'student_analytics' | 'classroom_analytics';
}

export interface AiResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

// Gemini pricing (per token) — gemini-2.5-flash as baseline
const INPUT_TOKEN_COST_PER_TOKEN = 0.00000015;
const OUTPUT_TOKEN_COST_PER_TOKEN = 0.0000006;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const BASE_DELAY_MS = 1000;

@Injectable()
export class GeminiService {
  private readonly client: GoogleGenerativeAI;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly logger = new Logger(GeminiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.maxRetries = this.configService.get<number>('AI_MAX_RETRIES') ?? 3;
    this.timeoutMs = this.configService.get<number>('AI_TIMEOUT_MS') ?? 30000;

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async sendMessage(request: AiRequest): Promise<AiResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await this.sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }

      try {
        const response = await this.callGeminiApi(request);
        await this.logUsage(request, response);
        return response;
      } catch (error) {
        lastError = error;
        const retryable = this.isRetryable(error);
        this.logger.warn(
          `AI call failed (attempt ${attempt + 1}/${this.maxRetries + 1}, retryable=${retryable}): ${this.extractErrorMessage(error)}`,
        );
        if (!retryable) {
          break;
        }
      }
    }

    const errorDetail = this.extractErrorMessage(lastError);
    this.logger.error(
      `AI call exhausted retries for feature "${request.feature}": ${errorDetail}`,
    );
    throw new InternalServerErrorException(
      `AI service unavailable after ${this.maxRetries + 1} attempts: ${errorDetail}`,
    );
  }

  private async callGeminiApi(request: AiRequest): Promise<AiResponse> {
    const model = this.client.getGenerativeModel({
      model: request.model,
      systemInstruction: request.systemPrompt,
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: request.userPrompt }] }],
    });

    const response = result.response;
    const content = response.text();
    const usage = response.usageMetadata;

    return {
      content,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
      model: request.model,
    };
  }

  private async logUsage(
    request: AiRequest,
    response: AiResponse,
  ): Promise<void> {
    const costUsd = calculateCost(response.inputTokens, response.outputTokens);

    try {
      await this.prisma.aiUsageLog.create({
        data: {
          tenant_id: request.tenantId,
          user_id: request.userId,
          feature: request.feature,
          model_used: response.model,
          input_tokens: response.inputTokens,
          output_tokens: response.outputTokens,
          cost_usd: costUsd,
        },
      });
    } catch (err) {
      // Non-fatal: log the error but do not fail the AI call
      this.logger.error(`Failed to write AI usage log: ${this.extractErrorMessage(err)}`);
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof Error) {
      const msg = error.message;
      // Google API errors often include HTTP status codes in the message
      for (const code of RETRYABLE_STATUS_CODES) {
        if (msg.includes(String(code))) return true;
      }
      // Network-level errors
      if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
        return true;
      }
    }
    return false;
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (
    inputTokens * INPUT_TOKEN_COST_PER_TOKEN +
    outputTokens * OUTPUT_TOKEN_COST_PER_TOKEN
  );
}
