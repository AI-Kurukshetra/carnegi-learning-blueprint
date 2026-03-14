import { BloomLevel, DifficultyLevel, QuestionType } from '@prisma/client';

export interface QuestionGenPromptContext {
  learningObjectiveTitle: string;
  bloomLevel: BloomLevel;
  topicName: string;
  subjectName: string;
  questionType: QuestionType;
  difficultyLevel: DifficultyLevel;
  count: number;
}

const QUESTION_TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  MCQ: 'Generate multiple-choice questions. Each question must have exactly 4 options. Exactly one option must be correct (is_correct: true). The three distractors must be plausible and reflect common misconceptions.',
  MULTI_SELECT:
    'Generate multi-select questions. Each question must have 4-6 options. Two or more options must be correct (is_correct: true). Distractors must be plausible.',
  SHORT_ANSWER:
    'Generate short-answer questions. Each question must have exactly one option representing the model answer (is_correct: true). The text should be the expected answer or key criteria for a correct response.',
};

export function buildQuestionGenPrompt(
  ctx: QuestionGenPromptContext,
): { system: string; user: string } {
  const system = `You are an expert K-12 assessment author with deep expertise in educational measurement and curriculum design.

Your responsibilities:
- Generate high-quality, curriculum-aligned assessment questions
- Ensure all content is culturally neutral, age-appropriate, and free of bias
- Align questions precisely to the given Bloom's Taxonomy level and difficulty
- Return ONLY valid JSON — no markdown, no explanation, no extra text

Output format: A JSON array of exactly ${ctx.count} question object(s), each with this structure:
{
  "stem": "The question text",
  "options": [
    {
      "text": "Option text",
      "is_correct": boolean,
      "rationale": "Why this option is correct or why this distractor is plausible",
      "order_index": 0
    }
  ],
  "hints": ["Hint 1 (broad nudge)", "Hint 2 (narrower)", "Hint 3 (near-reveal)"]
}

Rules:
- "hints" must always be an array of exactly 3 strings, progressing from broad to near-reveal
- "rationale" is required for every option
- "order_index" starts at 0 and increments per question
- ${QUESTION_TYPE_INSTRUCTIONS[ctx.questionType]}
- Never reveal the correct answer directly in hints`;

  const user = `Generate ${ctx.count} ${ctx.questionType} question(s) with the following specifications:

Subject: ${ctx.subjectName}
Topic: ${ctx.topicName}
Learning Objective: ${ctx.learningObjectiveTitle}
Bloom's Taxonomy Level: ${ctx.bloomLevel}
Difficulty Level: ${ctx.difficultyLevel}
Question Type: ${ctx.questionType}

Return only the JSON array.`;

  return { system, user };
}
