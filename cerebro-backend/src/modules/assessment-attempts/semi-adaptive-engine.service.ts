import { Injectable, NotFoundException } from '@nestjs/common';
import { DifficultyLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

// ── Plan types ────────────────────────────────────────────────

export interface ReserveQuestion {
  question_id: string;
  difficulty: string;
  used: boolean;
}

export interface SwapEvent {
  at_position: number;
  original_question_id: string;
  injected_question_id: string;
  trigger: string;
  timestamp: string;
}

export interface SemiAdaptivePlan {
  mode: 'SEMI_ADAPTIVE';
  base_question_ids: string[];
  reserve_questions: ReserveQuestion[];
  active_queue: string[];
  served_questions: string[];
  swap_log: SwapEvent[];
  consecutive_correct: number;
  challenge_injections_remaining: number;
}

export interface SemiAdaptiveConfig {
  challenge_trigger_streak: number;
}

const DEFAULT_CONFIG: SemiAdaptiveConfig = {
  challenge_trigger_streak: 2,
};

const RESERVE_COUNT = 5;

// ── Service ───────────────────────────────────────────────────

@Injectable()
export class SemiAdaptiveEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build a question plan: N base questions + 5 reserve questions from the
   * question bank for the given classroom's subject.
   */
  async buildQuestionPlan(
    tenantId: string,
    classroomId: string,
    questionCount: number,
  ): Promise<SemiAdaptivePlan> {
    // Resolve subject from classroom
    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
      select: { subject_id: true },
    });
    if (!classroom?.subject_id) {
      throw new NotFoundException('Classroom subject not found');
    }

    // Fetch all approved auto-gradeable questions for this subject
    const allQuestions = await this.prisma.question.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        review_status: 'APPROVED',
        type: { in: ['MCQ', 'MULTI_SELECT'] }, // Only auto-gradeable for streak tracking
        learning_objective: {
          topic: { subject_id: classroom.subject_id },
        },
      },
      select: { id: true, difficulty_level: true },
    });

    // Partition by difficulty
    const easy = allQuestions.filter(
      (q) => q.difficulty_level === DifficultyLevel.EASY,
    );
    const medium = allQuestions.filter(
      (q) => q.difficulty_level === DifficultyLevel.MEDIUM,
    );
    const hard = allQuestions.filter(
      (q) => q.difficulty_level === DifficultyLevel.HARD,
    );

    // Select N base questions with balanced distribution
    const baseQuestions = this.selectBaseQuestions(
      easy,
      medium,
      hard,
      questionCount,
    );
    const baseIds = new Set(baseQuestions.map((q) => q.id));

    // Select 5 reserve questions (not overlapping with base):
    // 1 EASY, 2 MEDIUM, 2 HARD — fallback to adjacent if pool exhausted
    const reserveQuestions = this.selectReserveQuestions(
      easy.filter((q) => !baseIds.has(q.id)),
      medium.filter((q) => !baseIds.has(q.id)),
      hard.filter((q) => !baseIds.has(q.id)),
    );

    // Shuffle base questions for presentation order
    const shuffledBase = this.shuffle(baseQuestions.map((q) => q.id));

    return {
      mode: 'SEMI_ADAPTIVE',
      base_question_ids: shuffledBase,
      reserve_questions: reserveQuestions.map((q) => ({
        question_id: q.id,
        difficulty: q.difficulty_level,
        used: false,
      })),
      active_queue: [...shuffledBase],
      served_questions: [],
      swap_log: [],
      consecutive_correct: 0,
      challenge_injections_remaining: reserveQuestions.length,
    };
  }

  /**
   * Process a student response: update streak, potentially inject a
   * challenge question into the upcoming queue.
   */
  processResponse(
    plan: SemiAdaptivePlan,
    isCorrect: boolean | null,
    config?: SemiAdaptiveConfig,
  ): SemiAdaptivePlan {
    const cfg = config ?? DEFAULT_CONFIG;
    const updated = { ...plan };

    // Only update streak for auto-graded questions
    if (isCorrect === true) {
      updated.consecutive_correct = plan.consecutive_correct + 1;
    } else if (isCorrect === false) {
      updated.consecutive_correct = 0;
    }
    // null (SHORT_ANSWER) — don't change streak

    // Check injection trigger
    if (
      updated.consecutive_correct >= cfg.challenge_trigger_streak &&
      updated.challenge_injections_remaining > 0
    ) {
      const nextPosition = this.findNextUnservedPosition(updated);
      if (nextPosition !== null) {
        const reserve = this.selectBestReserve(updated.reserve_questions);
        if (reserve) {
          const originalQuestionId = updated.active_queue[nextPosition];

          // Perform swap
          updated.active_queue = [...updated.active_queue];
          updated.active_queue[nextPosition] = reserve.question_id;

          // Mark reserve as used
          updated.reserve_questions = updated.reserve_questions.map((r) =>
            r.question_id === reserve.question_id ? { ...r, used: true } : r,
          );

          updated.challenge_injections_remaining -= 1;
          updated.consecutive_correct = 0; // Reset streak after injection

          updated.swap_log = [
            ...updated.swap_log,
            {
              at_position: nextPosition,
              original_question_id: originalQuestionId,
              injected_question_id: reserve.question_id,
              trigger: `${cfg.challenge_trigger_streak}_consecutive_correct`,
              timestamp: new Date().toISOString(),
            },
          ];
        }
      }
    }

    return updated;
  }

  /**
   * Get the next unserved question from the active queue.
   * Returns null if all questions have been served.
   */
  getNextQuestionId(plan: SemiAdaptivePlan): string | null {
    const servedSet = new Set(plan.served_questions);
    for (const questionId of plan.active_queue) {
      if (!servedSet.has(questionId)) {
        return questionId;
      }
    }
    return null;
  }

  /**
   * Mark a question as served in the plan.
   */
  markServed(plan: SemiAdaptivePlan, questionId: string): SemiAdaptivePlan {
    return {
      ...plan,
      served_questions: [...plan.served_questions, questionId],
    };
  }

  /**
   * Check if the assessment is complete (all questions in active_queue served).
   */
  isComplete(plan: SemiAdaptivePlan): boolean {
    return plan.served_questions.length >= plan.active_queue.length;
  }

  /**
   * Fetch question with options by ID.
   */
  async loadQuestion(tenantId: string, questionId: string) {
    return this.prisma.question.findFirst({
      where: { id: questionId, tenant_id: tenantId, deleted_at: null },
      include: {
        question_options: { orderBy: { order_index: 'asc' } },
      },
    });
  }

  // ── Private helpers ──────────────────────────────────────────

  private selectBaseQuestions(
    easy: { id: string }[],
    medium: { id: string }[],
    hard: { id: string }[],
    count: number,
  ): { id: string }[] {
    // Target distribution: 40% EASY, 40% MEDIUM, 20% HARD
    const easyCount = Math.round(count * 0.4);
    const hardCount = Math.round(count * 0.2);
    const mediumCount = count - easyCount - hardCount;

    const selected: { id: string }[] = [];

    // Pick from each pool, fallback to others if pool is too small
    selected.push(...this.pickRandom(easy, easyCount));
    selected.push(...this.pickRandom(medium, mediumCount));
    selected.push(...this.pickRandom(hard, hardCount));

    // If we didn't get enough, fill from remaining questions
    const selectedIds = new Set(selected.map((q) => q.id));
    const remaining = [...easy, ...medium, ...hard].filter(
      (q) => !selectedIds.has(q.id),
    );

    while (selected.length < count && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      selected.push(remaining.splice(idx, 1)[0]);
    }

    return selected;
  }

  private selectReserveQuestions(
    easy: { id: string; difficulty_level: string }[],
    medium: { id: string; difficulty_level: string }[],
    hard: { id: string; difficulty_level: string }[],
  ): { id: string; difficulty_level: string }[] {
    const reserve: { id: string; difficulty_level: string }[] = [];

    // Target: 1 EASY, 2 MEDIUM, 2 HARD
    reserve.push(...this.pickRandom(easy, 1));
    reserve.push(...this.pickRandom(medium, 2));
    reserve.push(...this.pickRandom(hard, 2));

    // Fill shortfall from any remaining pool
    if (reserve.length < RESERVE_COUNT) {
      const reserveIds = new Set(reserve.map((q) => q.id));
      const remaining = [...easy, ...medium, ...hard].filter(
        (q) => !reserveIds.has(q.id),
      );
      while (reserve.length < RESERVE_COUNT && remaining.length > 0) {
        const idx = Math.floor(Math.random() * remaining.length);
        reserve.push(remaining.splice(idx, 1)[0]);
      }
    }

    return reserve;
  }

  private findNextUnservedPosition(plan: SemiAdaptivePlan): number | null {
    const servedSet = new Set(plan.served_questions);
    for (let i = 0; i < plan.active_queue.length; i++) {
      if (!servedSet.has(plan.active_queue[i])) {
        return i;
      }
    }
    return null;
  }

  private selectBestReserve(
    reserves: ReserveQuestion[],
  ): ReserveQuestion | null {
    // Prefer HARD, then MEDIUM, then EASY
    const available = reserves.filter((r) => !r.used);
    const hard = available.find((r) => r.difficulty === 'HARD');
    if (hard) return hard;
    const medium = available.find((r) => r.difficulty === 'MEDIUM');
    if (medium) return medium;
    const easy = available.find((r) => r.difficulty === 'EASY');
    return easy ?? null;
  }

  private pickRandom<T>(pool: T[], count: number): T[] {
    const shuffled = this.shuffle([...pool]);
    return shuffled.slice(0, count);
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
