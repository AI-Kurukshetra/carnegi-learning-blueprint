export interface StudentInsightPromptContext {
  studentName: string;
  assessments: {
    title: string;
    type: string;
    scorePct: number | null;
    status: string;
  }[];
  assessmentSummary: {
    total_taken: number;
    total_submitted: number;
    average_score_pct: number | null;
    highest_score_pct: number | null;
    lowest_score_pct: number | null;
  };
  milestones: {
    title: string;
    status: string;
    due_date: Date | null;
  }[];
  milestoneSummary: {
    total: number;
    completed: number;
    in_progress: number;
    not_started: number;
  };
  milestoneCompletionPct: number;
}

export function buildStudentInsightPrompt(ctx: StudentInsightPromptContext): {
  system: string;
  user: string;
} {
  const system = `You are an expert educational advisor who provides concise, constructive student progress summaries and actionable recommendations.

Respond ONLY with valid JSON matching this exact structure — no markdown fences, no prose outside the JSON:
{
  "summary": "2-3 sentence overview of student performance and progress",
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["area 1", "area 2"],
  "recommended_next_milestone": {
    "title": "suggested milestone title",
    "description": "why this milestone would benefit the student"
  }
}

Rules:
- Respond ONLY with valid JSON — no markdown, no extra text
- Be constructive and encouraging in tone
- Recommendations must be specific and actionable
- Base all observations strictly on the data provided`;

  const assessmentLines =
    ctx.assessments.length > 0
      ? ctx.assessments
          .map(
            (a) =>
              `  - "${a.title}" (${a.type}): ${a.scorePct !== null ? `${a.scorePct}%` : 'no score'}, status=${a.status}`,
          )
          .join('\n')
      : '  (no assessments recorded)';

  const milestoneLines =
    ctx.milestones.length > 0
      ? ctx.milestones
          .map(
            (m) =>
              `  - "${m.title}": status=${m.status}${m.due_date ? `, due=${m.due_date.toISOString().split('T')[0]}` : ''}`,
          )
          .join('\n')
      : '  (no milestones recorded)';

  const user = `Student: ${ctx.studentName}

Assessment History:
${assessmentLines}

Assessment Summary:
  Total taken: ${ctx.assessmentSummary.total_taken}
  Total submitted: ${ctx.assessmentSummary.total_submitted}
  Average score: ${ctx.assessmentSummary.average_score_pct !== null ? `${ctx.assessmentSummary.average_score_pct}%` : 'N/A'}
  Highest score: ${ctx.assessmentSummary.highest_score_pct !== null ? `${ctx.assessmentSummary.highest_score_pct}%` : 'N/A'}
  Lowest score: ${ctx.assessmentSummary.lowest_score_pct !== null ? `${ctx.assessmentSummary.lowest_score_pct}%` : 'N/A'}

Milestones:
${milestoneLines}

Milestone Summary:
  Total: ${ctx.milestoneSummary.total}
  Completed: ${ctx.milestoneSummary.completed}
  In progress: ${ctx.milestoneSummary.in_progress}
  Not started: ${ctx.milestoneSummary.not_started}
  Completion: ${ctx.milestoneCompletionPct}%`;

  return { system, user };
}
