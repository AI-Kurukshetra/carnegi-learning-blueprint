export interface ClassroomAnalyticsPromptContext {
  classroomName: string;
  subjectName: string;
  totalStudents: number;
  assessments: {
    title: string;
    type: string;
    totalAttempts: number;
    avgScorePct: number | null;
    passRate: number | null;
  }[];
  overallMetrics: {
    totalAssessments: number;
    totalAttempts: number;
    overallAvgScorePct: number | null;
    overallPassRate: number | null;
  };
  bloomDistribution: {
    level: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracyPct: number;
  }[];
  milestoneMetrics: {
    totalMilestones: number;
    avgCompletionPct: number;
  };
}

export function buildClassroomAnalyticsPrompt(ctx: ClassroomAnalyticsPromptContext): {
  system: string;
  user: string;
} {
  const system = `You are an expert educational data analyst who provides classroom-level performance analytics for teachers.

Respond ONLY with valid JSON matching this exact structure — no markdown fences, no prose outside the JSON:
{
  "summary": "2-3 sentence overview of classroom performance",
  "bloom_profile": {
    "dominant_level": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
    "class_orientation": "recall-oriented|comprehension-focused|application-driven|analytical|evaluative|creative|balanced",
    "orientation_description": "1-2 sentences explaining the class learning style"
  },
  "performance_insights": {
    "average_score_pct": <number>,
    "pass_rate_pct": <number>,
    "needs_attention": <boolean>
  },
  "strengths": ["strength 1", "strength 2"],
  "areas_for_improvement": ["area 1", "area 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"]
}

Rules:
- Respond ONLY with valid JSON — no markdown, no extra text
- "needs_attention" is true if average score is below 50% or pass rate is below 60%
- "dominant_level" should reflect which Bloom level has the most questions AND highest accuracy
- "class_orientation" maps Bloom levels: REMEMBER=recall-oriented, UNDERSTAND=comprehension-focused, APPLY=application-driven, ANALYZE=analytical, EVALUATE=evaluative, CREATE=creative, mixed=balanced
- Recommendations must be specific and actionable for the teacher
- If data is insufficient, note that in the summary and provide general recommendations`;

  const assessmentLines =
    ctx.assessments.length > 0
      ? ctx.assessments
          .map(
            (a) =>
              `  - "${a.title}" (${a.type}): ${a.totalAttempts} attempts, avg=${a.avgScorePct !== null ? `${a.avgScorePct}%` : 'N/A'}, pass_rate=${a.passRate !== null ? `${a.passRate}%` : 'N/A'}`,
          )
          .join('\n')
      : '  (no assessments recorded)';

  const bloomLines =
    ctx.bloomDistribution.length > 0
      ? ctx.bloomDistribution
          .map(
            (b) =>
              `  - ${b.level}: ${b.totalQuestions} questions, ${b.correctAnswers} correct, ${b.accuracyPct}% accuracy`,
          )
          .join('\n')
      : '  (no bloom data available)';

  const user = `Classroom: ${ctx.classroomName}
Subject: ${ctx.subjectName}
Total Students: ${ctx.totalStudents}

Assessment Performance:
${assessmentLines}

Overall Metrics:
  Total assessments: ${ctx.overallMetrics.totalAssessments}
  Total attempts: ${ctx.overallMetrics.totalAttempts}
  Overall average score: ${ctx.overallMetrics.overallAvgScorePct !== null ? `${ctx.overallMetrics.overallAvgScorePct}%` : 'N/A'}
  Overall pass rate: ${ctx.overallMetrics.overallPassRate !== null ? `${ctx.overallMetrics.overallPassRate}%` : 'N/A'}

Bloom's Taxonomy Distribution:
${bloomLines}

Milestone Metrics:
  Total milestones: ${ctx.milestoneMetrics.totalMilestones}
  Average completion: ${ctx.milestoneMetrics.avgCompletionPct}%`;

  return { system, user };
}
