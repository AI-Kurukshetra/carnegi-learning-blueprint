export interface BloomStats {
  total: number;
  correct: number;
  percentage: number;
}

export interface SubjectQuadrant {
  subject_name: string;
  subject_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  bloom_breakdown: Record<string, BloomStats>;
}

export interface StudentAnalyticsPromptContext {
  studentName: string;
  overallStats: {
    total_assessments: number;
    total_questions_answered: number;
    total_correct: number;
    overall_accuracy: number;
    milestone_completion_pct: number;
  };
  bloomTaxonomy: Record<string, BloomStats>;
  subjectQuadrants: SubjectQuadrant[];
}

export function buildStudentAnalyticsPrompt(ctx: StudentAnalyticsPromptContext): {
  system: string;
  user: string;
} {
  const system = `You are an expert educational advisor who analyzes student performance data and provides actionable focus area recommendations.

Respond ONLY with valid JSON matching this exact structure — no markdown fences, no prose outside the JSON:
{
  "summary": "2-3 sentence overview of the student's learning profile based on bloom taxonomy and subject performance",
  "focus_areas": ["specific area 1 the student should focus on", "area 2", "area 3"],
  "study_recommendations": [
    "actionable recommendation 1 based on weak bloom levels or subjects",
    "recommendation 2",
    "recommendation 3"
  ],
  "strengths_narrative": "1-2 sentences highlighting what the student excels at based on data",
  "growth_narrative": "1-2 sentences about areas with the most room for growth"
}

Rules:
- Respond ONLY with valid JSON — no markdown, no extra text
- Map bloom levels to practical skills: REMEMBER=recall, UNDERSTAND=comprehension, APPLY=practical application, ANALYZE=analytical thinking, EVALUATE=decision making/judgement, CREATE=creative/synthesis
- Focus recommendations should be specific and actionable
- If a bloom level has 0 questions, do not flag it as a weakness — note it as unexplored
- Be constructive and encouraging in tone
- Base all observations strictly on the data provided`;

  const bloomLines = Object.entries(ctx.bloomTaxonomy)
    .map(
      ([level, stats]) =>
        `  ${level}: ${stats.correct}/${stats.total} correct (${stats.percentage}%)`,
    )
    .join('\n');

  const subjectLines =
    ctx.subjectQuadrants.length > 0
      ? ctx.subjectQuadrants
          .map((sq) => {
            const bloomDetail = Object.entries(sq.bloom_breakdown)
              .map(([bl, s]) => `${bl}: ${s.correct}/${s.total} (${s.percentage}%)`)
              .join(', ');
            return `  - ${sq.subject_name}: ${sq.correct_answers}/${sq.total_questions} correct (${sq.score_percentage}%) [${bloomDetail}]`;
          })
          .join('\n')
      : '  (no subject data available)';

  const user = `Student: ${ctx.studentName}

Overall Stats:
  Total assessments taken: ${ctx.overallStats.total_assessments}
  Total questions answered: ${ctx.overallStats.total_questions_answered}
  Total correct: ${ctx.overallStats.total_correct}
  Overall accuracy: ${ctx.overallStats.overall_accuracy}%
  Milestone completion: ${ctx.overallStats.milestone_completion_pct}%

Bloom Taxonomy Breakdown (questions correctly answered per level):
${bloomLines}

Subject Performance:
${subjectLines}`;

  return { system, user };
}
