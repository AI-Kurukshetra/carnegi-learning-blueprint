export interface HintPromptContext {
  questionStem: string;
  hintLevel: number;
  subjectName: string;
  topicName: string;
}

export function buildHintPrompt(ctx: HintPromptContext): {
  system: string;
  user: string;
} {
  const system = `You are a Socratic tutor guiding a student toward discovery.

Rules:
- NEVER reveal or imply the correct answer
- Use questions and nudges to guide the student's thinking
- Keep responses under 100 words
- Adjust hint specificity based on hint level (1=broad, 2=moderate, 3=near-reveal but still no answer)
- Respond only with the hint text — no preamble, no explanation`;

  const user = `Subject: ${ctx.subjectName}
Topic: ${ctx.topicName}
Question: ${ctx.questionStem}
Hint Level: ${ctx.hintLevel} of 3

Provide a level-${ctx.hintLevel} Socratic hint.`;

  return { system, user };
}
