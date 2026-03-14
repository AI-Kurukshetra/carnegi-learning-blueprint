import { Injectable } from '@nestjs/common';
import { DifficultyLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AdaptiveConfig {
  starting_difficulty: DifficultyLevel;
  max_questions: number;
  correct_streak_to_increase: number;
  incorrect_streak_to_decrease: number;
}

export interface QuestionSequenceEntry {
  question_id: string;
  difficulty: string;
  order: number;
}

export interface AdaptiveState {
  current_difficulty: DifficultyLevel;
  correct_streak: number;
  incorrect_streak: number;
  questions_served: string[];
  question_sequence: QuestionSequenceEntry[];
}

const DEFAULT_CONFIG: AdaptiveConfig = {
  starting_difficulty: DifficultyLevel.EASY,
  max_questions: 20,
  correct_streak_to_increase: 3,
  incorrect_streak_to_decrease: 2,
};

@Injectable()
export class AdaptiveEngineService {
  constructor(private readonly prisma: PrismaService) {}

  resolveConfig(raw?: unknown): AdaptiveConfig {
    if (!raw || typeof raw !== 'object') {
      return { ...DEFAULT_CONFIG };
    }
    const src = raw as Record<string, unknown>;
    return {
      starting_difficulty:
        this.parseDifficulty(src['starting_difficulty']) ??
        DEFAULT_CONFIG.starting_difficulty,
      max_questions:
        typeof src['max_questions'] === 'number'
          ? src['max_questions']
          : DEFAULT_CONFIG.max_questions,
      correct_streak_to_increase:
        typeof src['correct_streak_to_increase'] === 'number'
          ? src['correct_streak_to_increase']
          : DEFAULT_CONFIG.correct_streak_to_increase,
      incorrect_streak_to_decrease:
        typeof src['incorrect_streak_to_decrease'] === 'number'
          ? src['incorrect_streak_to_decrease']
          : DEFAULT_CONFIG.incorrect_streak_to_decrease,
    };
  }

  initializeState(config: AdaptiveConfig): AdaptiveState {
    return {
      current_difficulty: config.starting_difficulty,
      correct_streak: 0,
      incorrect_streak: 0,
      questions_served: [],
      question_sequence: [],
    };
  }

  updateState(
    state: AdaptiveState,
    isCorrect: boolean,
    config: AdaptiveConfig,
  ): AdaptiveState {
    const newState = { ...state };

    if (isCorrect) {
      newState.correct_streak = state.correct_streak + 1;
      newState.incorrect_streak = 0;
    } else {
      newState.incorrect_streak = state.incorrect_streak + 1;
      newState.correct_streak = 0;
    }

    newState.current_difficulty = this.adjustDifficulty(
      state.current_difficulty,
      newState.correct_streak,
      newState.incorrect_streak,
      config,
    );

    return newState;
  }

  async getSubjectIdForAssessment(
    tenantId: string,
    classroomId: string | null,
  ): Promise<string | null> {
    if (!classroomId) return null;

    const classroom = await this.prisma.classroom.findFirst({
      where: { id: classroomId, tenant_id: tenantId, deleted_at: null },
      select: { subject_id: true },
    });

    return classroom?.subject_id ?? null;
  }

  async selectNextQuestion(
    tenantId: string,
    subjectId: string,
    state: AdaptiveState,
  ) {
    return this.prisma.question.findFirst({
      where: {
        tenant_id: tenantId,
        difficulty_level: state.current_difficulty,
        deleted_at: null,
        review_status: 'APPROVED',
        id: { notIn: state.questions_served },
        learning_objective: {
          topic: {
            subject_id: subjectId,
          },
        },
      },
      include: { question_options: true },
    });
  }

  async computeAnalytics(tenantId: string, attemptId: string) {
    const responses = await this.prisma.attemptResponse.findMany({
      where: { tenant_id: tenantId, attempt_id: attemptId },
      select: {
        is_correct: true,
        served_difficulty: true,
        time_spent_seconds: true,
        sequence_order: true,
      },
      orderBy: { sequence_order: 'asc' },
    });

    const total = responses.length;
    const correct = responses.filter((r) => r.is_correct === true).length;
    const accuracy = total > 0 ? correct / total : 0;

    const byDifficulty = this.groupByDifficulty(responses);

    return {
      total_questions: total,
      correct_answers: correct,
      accuracy,
      difficulty_breakdown: byDifficulty,
    };
  }

  private adjustDifficulty(
    current: DifficultyLevel,
    correctStreak: number,
    incorrectStreak: number,
    config: AdaptiveConfig,
  ): DifficultyLevel {
    if (correctStreak >= config.correct_streak_to_increase) {
      return this.increaseDifficulty(current);
    }
    if (incorrectStreak >= config.incorrect_streak_to_decrease) {
      return this.decreaseDifficulty(current);
    }
    return current;
  }

  private increaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    if (current === DifficultyLevel.EASY) return DifficultyLevel.MEDIUM;
    if (current === DifficultyLevel.MEDIUM) return DifficultyLevel.HARD;
    return current;
  }

  private decreaseDifficulty(current: DifficultyLevel): DifficultyLevel {
    if (current === DifficultyLevel.HARD) return DifficultyLevel.MEDIUM;
    if (current === DifficultyLevel.MEDIUM) return DifficultyLevel.EASY;
    return current;
  }

  private parseDifficulty(value: unknown): DifficultyLevel | null {
    if (value === 'EASY') return DifficultyLevel.EASY;
    if (value === 'MEDIUM') return DifficultyLevel.MEDIUM;
    if (value === 'HARD') return DifficultyLevel.HARD;
    return null;
  }

  private groupByDifficulty(
    responses: { is_correct: boolean | null; served_difficulty: string | null }[],
  ) {
    const groups: Record<string, { total: number; correct: number }> = {};

    for (const r of responses) {
      const key = r.served_difficulty ?? 'UNKNOWN';
      if (!groups[key]) {
        groups[key] = { total: 0, correct: 0 };
      }
      groups[key].total += 1;
      if (r.is_correct === true) {
        groups[key].correct += 1;
      }
    }

    return groups;
  }
}
