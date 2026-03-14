export interface GradingPromptContext {
  questionStem: string;
  modelAnswer: string;
  studentResponse: string;
  subjectName: string;
}

export interface GradingResult {
  score: number;
  confidence: number;
  rationale: string;
}

export function buildGradingPrompt(ctx: GradingPromptContext): {
  system: string;
  user: string;
} {
  const system = `You are an expert educational assessment grader.

Score student short-answer responses against a model answer.

Return ONLY valid JSON with this structure:
{
  "score": <float 0-1>,
  "confidence": <float 0-1>,
  "rationale": "<brief explanation of the score>"
}

Scoring guidance:
- 1.0 = fully correct, demonstrates complete understanding
- 0.5-0.9 = partially correct, shows understanding with gaps
- 0.1-0.4 = minimal relevant content
- 0.0 = incorrect or irrelevant
- confidence reflects how certain you are of the score given potential ambiguity`;

  const user = `Subject: ${ctx.subjectName}
Question: ${ctx.questionStem}
Model Answer: ${ctx.modelAnswer}
Student Response: ${ctx.studentResponse}

Grade this response and return the JSON.`;

  return { system, user };
}
