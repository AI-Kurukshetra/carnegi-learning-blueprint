/**
 * Synthetic Data Generation Script
 * =================================
 * Generates comprehensive assessment data for 3 schools with:
 * - 1 School Admin per school
 * - 5 Teachers per school
 * - 5 Students per school
 * - Mathematics subject with topics, LOs, competency standards
 * - 30+ questions (MCQ, MULTI_SELECT, SHORT_ANSWER) with AI metadata
 * - 10+ assessments with full attempt data
 * - Knowledge states, hint requests, telemetry events
 *
 * Usage: npx ts-node scripts/generate-synthetic-data.ts
 */

import {
  PrismaClient,
  Role,
  BloomLevel,
  QuestionType,
  DifficultyLevel,
  ReviewStatus,
  AssessmentType,
  AssessmentStatus,
  AttemptStatus,
  TelemetryEventType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// ============================================================
// HELPERS
// ============================================================

function uuid(): string {
  return randomUUID();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

// ============================================================
// SCHOOL DEFINITIONS
// ============================================================

const SCHOOLS = [
  { name: 'Greenwood International Academy', slug: 'greenwood-academy' },
  { name: 'Maple Ridge High School', slug: 'maple-ridge-hs' },
  { name: 'Sunrise Valley School', slug: 'sunrise-valley' },
];

const TEACHER_NAMES = [
  ['Priya', 'Sharma'],
  ['Michael', 'Chen'],
  ['Sarah', 'Johnson'],
  ['David', 'Kim'],
  ['Laura', 'Martinez'],
];

const STUDENT_NAMES = [
  ['Aiden', 'Brooks'],
  ['Sofia', 'Patel'],
  ['Liam', 'O\'Brien'],
  ['Emma', 'Nakamura'],
  ['Noah', 'Rivera'],
];

const ADMIN_NAMES = [
  ['Robert', 'Anderson'],
  ['Maria', 'Garcia'],
  ['James', 'Wilson'],
];

// ============================================================
// MATHEMATICS CURRICULUM DATA
// ============================================================

interface TopicDef {
  name: string;
  description: string;
  learningObjectives: {
    title: string;
    description: string;
    bloomLevel: BloomLevel;
  }[];
}

const MATH_TOPICS: TopicDef[] = [
  {
    name: 'Algebra — Linear Equations',
    description: 'Solving and graphing linear equations in one and two variables',
    learningObjectives: [
      {
        title: 'Solve linear equations in one variable',
        description: 'Solve equations of the form ax + b = c using inverse operations',
        bloomLevel: BloomLevel.APPLY,
      },
      {
        title: 'Identify slope and y-intercept from an equation',
        description: 'Extract slope (m) and y-intercept (b) from y = mx + b form',
        bloomLevel: BloomLevel.UNDERSTAND,
      },
      {
        title: 'Graph linear equations on a coordinate plane',
        description: 'Plot linear equations using slope-intercept or two-point method',
        bloomLevel: BloomLevel.APPLY,
      },
    ],
  },
  {
    name: 'Algebra — Quadratic Equations',
    description: 'Solving quadratic equations by factoring, completing the square, and the quadratic formula',
    learningObjectives: [
      {
        title: 'Factor quadratic expressions',
        description: 'Factor expressions of the form ax² + bx + c into two binomials',
        bloomLevel: BloomLevel.APPLY,
      },
      {
        title: 'Solve quadratics using the quadratic formula',
        description: 'Apply x = (-b ± √(b²-4ac)) / 2a to find roots',
        bloomLevel: BloomLevel.APPLY,
      },
      {
        title: 'Analyze the discriminant to determine root types',
        description: 'Use b²-4ac to classify roots as real/complex, distinct/repeated',
        bloomLevel: BloomLevel.ANALYZE,
      },
    ],
  },
  {
    name: 'Geometry — Triangles',
    description: 'Properties, classification, and theorems related to triangles',
    learningObjectives: [
      {
        title: 'Classify triangles by sides and angles',
        description: 'Distinguish equilateral, isosceles, scalene, acute, right, and obtuse triangles',
        bloomLevel: BloomLevel.REMEMBER,
      },
      {
        title: 'Apply the Pythagorean theorem',
        description: 'Use a² + b² = c² to find missing sides in right triangles',
        bloomLevel: BloomLevel.APPLY,
      },
      {
        title: 'Calculate the area of a triangle using different methods',
        description: 'Apply ½bh, Heron\'s formula, and trigonometric area formula',
        bloomLevel: BloomLevel.APPLY,
      },
    ],
  },
  {
    name: 'Statistics & Probability',
    description: 'Measures of central tendency, variability, and introductory probability',
    learningObjectives: [
      {
        title: 'Calculate mean, median, and mode',
        description: 'Compute and compare measures of central tendency for data sets',
        bloomLevel: BloomLevel.APPLY,
      },
      {
        title: 'Compute probability of simple events',
        description: 'Apply P(A) = favorable outcomes / total outcomes',
        bloomLevel: BloomLevel.APPLY,
      },
      {
        title: 'Evaluate whether data supports a given claim',
        description: 'Interpret statistical summaries to support or refute a hypothesis',
        bloomLevel: BloomLevel.EVALUATE,
      },
    ],
  },
];

const COMPETENCY_STANDARDS = [
  { code: 'CCSS.MATH.A.REI', title: 'Reasoning with Equations and Inequalities', description: 'Understand solving equations as a reasoning process and explain the reasoning' },
  { code: 'CCSS.MATH.A.SSE', title: 'Seeing Structure in Expressions', description: 'Interpret the structure of expressions and use structure to rewrite expressions' },
  { code: 'CCSS.MATH.G.SRT', title: 'Similarity, Right Triangles, and Trigonometry', description: 'Understand similarity and use properties of right triangles' },
  { code: 'CCSS.MATH.S.ID', title: 'Interpreting Categorical and Quantitative Data', description: 'Summarize, represent, and interpret data' },
  { code: 'CCSS.MATH.S.CP', title: 'Conditional Probability and Rules of Probability', description: 'Understand independence and conditional probability' },
];

// ============================================================
// QUESTIONS BANK
// ============================================================

interface QuestionDef {
  topicIndex: number;       // index into MATH_TOPICS
  loIndex: number;          // index into topic's learningObjectives
  type: QuestionType;
  stem: string;
  difficultyLevel: DifficultyLevel;
  bloomLevel: BloomLevel;
  isAiGenerated: boolean;
  hints: { level: number; text: string }[];
  options?: { text: string; isCorrect: boolean; rationale?: string }[];
  shortAnswerExpected?: string;
}

const QUESTIONS: QuestionDef[] = [
  // === Topic 0: Linear Equations (LO 0 - Solve linear equations) ===
  {
    topicIndex: 0, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'Solve for x: 3x + 7 = 22',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Start by isolating the variable term.' },
      { level: 2, text: 'Subtract 7 from both sides first.' },
      { level: 3, text: '3x = 15. Now divide both sides by 3.' },
    ],
    options: [
      { text: 'x = 3', isCorrect: false, rationale: 'This would mean 3(3)+7=16, not 22.' },
      { text: 'x = 5', isCorrect: true, rationale: '3(5)+7 = 15+7 = 22. Correct!' },
      { text: 'x = 7', isCorrect: false, rationale: '3(7)+7=28, not 22.' },
      { text: 'x = 4', isCorrect: false, rationale: '3(4)+7=19, not 22.' },
    ],
  },
  {
    topicIndex: 0, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'What is the value of y in the equation 2y - 8 = 12?',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Add 8 to both sides to isolate the term with y.' },
      { level: 2, text: '2y = 20. What is y?' },
      { level: 3, text: 'Divide 20 by 2.' },
    ],
    options: [
      { text: 'y = 10', isCorrect: true, rationale: '2(10)-8=20-8=12. Correct!' },
      { text: 'y = 8', isCorrect: false, rationale: '2(8)-8=8, not 12.' },
      { text: 'y = 6', isCorrect: false, rationale: '2(6)-8=4, not 12.' },
      { text: 'y = 12', isCorrect: false, rationale: '2(12)-8=16, not 12.' },
    ],
  },
  {
    topicIndex: 0, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'Solve: 5(x - 2) = 3x + 6',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'First, distribute the 5 on the left side.' },
      { level: 2, text: '5x - 10 = 3x + 6. Now collect like terms.' },
      { level: 3, text: '2x = 16, so x = 8.' },
    ],
    options: [
      { text: 'x = 8', isCorrect: true, rationale: '5(8-2)=5(6)=30; 3(8)+6=30. Correct!' },
      { text: 'x = 4', isCorrect: false, rationale: '5(4-2)=10; 3(4)+6=18. Not equal.' },
      { text: 'x = 6', isCorrect: false, rationale: '5(6-2)=20; 3(6)+6=24. Not equal.' },
      { text: 'x = 10', isCorrect: false, rationale: '5(10-2)=40; 3(10)+6=36. Not equal.' },
    ],
  },
  // === Topic 0: Linear Equations (LO 1 - Slope and y-intercept) ===
  {
    topicIndex: 0, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'What is the slope of the line y = -3x + 5?',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.UNDERSTAND,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'The equation is in slope-intercept form: y = mx + b.' },
      { level: 2, text: 'm represents the slope. What is the coefficient of x?' },
      { level: 3, text: 'The coefficient of x is -3.' },
    ],
    options: [
      { text: '-3', isCorrect: true, rationale: 'In y=mx+b, m=-3 is the slope.' },
      { text: '5', isCorrect: false, rationale: '5 is the y-intercept, not the slope.' },
      { text: '3', isCorrect: false, rationale: 'The sign matters; the slope is -3, not 3.' },
      { text: '-5', isCorrect: false, rationale: '-5 is not part of this equation\'s slope.' },
    ],
  },
  // === Topic 0: Linear Equations (LO 2 - Graph linear equations) ===
  {
    topicIndex: 0, loIndex: 2,
    type: QuestionType.SHORT_ANSWER,
    stem: 'Explain the steps you would take to graph the equation y = 2x - 1 on a coordinate plane.',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Start by finding the y-intercept.' },
      { level: 2, text: 'The y-intercept is -1, so plot (0, -1). Then use the slope.' },
      { level: 3, text: 'Slope is 2 = 2/1, so from (0,-1) go up 2 and right 1 to (1, 1).' },
    ],
    shortAnswerExpected: 'Plot the y-intercept at (0, -1). Then use the slope of 2 (rise 2, run 1) to find another point at (1, 1). Draw a straight line through both points.',
  },
  // === Topic 1: Quadratic Equations (LO 0 - Factor quadratics) ===
  {
    topicIndex: 1, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'Factor the expression: x² + 5x + 6',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Find two numbers that multiply to 6 and add to 5.' },
      { level: 2, text: 'The numbers are 2 and 3 (2×3=6, 2+3=5).' },
      { level: 3, text: 'So x² + 5x + 6 = (x + 2)(x + 3).' },
    ],
    options: [
      { text: '(x + 2)(x + 3)', isCorrect: true, rationale: '(x+2)(x+3) = x²+3x+2x+6 = x²+5x+6.' },
      { text: '(x + 1)(x + 6)', isCorrect: false, rationale: '(x+1)(x+6) = x²+7x+6, not x²+5x+6.' },
      { text: '(x - 2)(x - 3)', isCorrect: false, rationale: '(x-2)(x-3) = x²-5x+6, signs are wrong.' },
      { text: '(x + 5)(x + 1)', isCorrect: false, rationale: '(x+5)(x+1) = x²+6x+5, not x²+5x+6.' },
    ],
  },
  {
    topicIndex: 1, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'Factor: 2x² - 7x + 3',
    difficultyLevel: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'Multiply a and c: 2 × 3 = 6. Find two numbers that multiply to 6 and add to -7.' },
      { level: 2, text: 'The numbers are -6 and -1. Rewrite -7x as -6x - x.' },
      { level: 3, text: '2x² - 6x - x + 3 = 2x(x-3) - 1(x-3) = (2x-1)(x-3).' },
    ],
    options: [
      { text: '(2x - 1)(x - 3)', isCorrect: true, rationale: '(2x-1)(x-3) = 2x²-6x-x+3 = 2x²-7x+3.' },
      { text: '(2x + 1)(x - 3)', isCorrect: false, rationale: '(2x+1)(x-3) = 2x²-5x-3, wrong.' },
      { text: '(2x - 3)(x - 1)', isCorrect: false, rationale: '(2x-3)(x-1) = 2x²-5x+3, wrong.' },
      { text: '(x - 1)(2x - 3)', isCorrect: false, rationale: 'Same as (2x-3)(x-1), gives 2x²-5x+3.' },
    ],
  },
  // === Topic 1: Quadratic Equations (LO 1 - Quadratic formula) ===
  {
    topicIndex: 1, loIndex: 1,
    type: QuestionType.MULTI_SELECT,
    stem: 'Which of the following are solutions to x² - 5x + 6 = 0? Select all that apply.',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Try factoring the quadratic first.' },
      { level: 2, text: 'x² - 5x + 6 = (x - 2)(x - 3) = 0.' },
      { level: 3, text: 'Set each factor to zero: x = 2 or x = 3.' },
    ],
    options: [
      { text: 'x = 1', isCorrect: false, rationale: '1-5+6=2≠0.' },
      { text: 'x = 2', isCorrect: true, rationale: '4-10+6=0. Correct!' },
      { text: 'x = 3', isCorrect: true, rationale: '9-15+6=0. Correct!' },
      { text: 'x = 5', isCorrect: false, rationale: '25-25+6=6≠0.' },
      { text: 'x = 6', isCorrect: false, rationale: '36-30+6=12≠0.' },
    ],
  },
  // === Topic 1: Quadratic Equations (LO 2 - Discriminant) ===
  {
    topicIndex: 1, loIndex: 2,
    type: QuestionType.MCQ,
    stem: 'What does the discriminant of the equation x² + 4x + 5 = 0 tell us about its roots?',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.ANALYZE,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'The discriminant is b² - 4ac.' },
      { level: 2, text: 'Here, b²-4ac = 16-20 = -4.' },
      { level: 3, text: 'A negative discriminant means no real roots (two complex roots).' },
    ],
    options: [
      { text: 'Two distinct real roots', isCorrect: false, rationale: 'This requires discriminant > 0.' },
      { text: 'One repeated real root', isCorrect: false, rationale: 'This requires discriminant = 0.' },
      { text: 'Two complex (non-real) roots', isCorrect: true, rationale: 'Discriminant = 16-20 = -4 < 0, so roots are complex.' },
      { text: 'No roots exist', isCorrect: false, rationale: 'Complex roots exist, just not real ones.' },
    ],
  },
  {
    topicIndex: 1, loIndex: 2,
    type: QuestionType.SHORT_ANSWER,
    stem: 'Calculate the discriminant of 3x² - 2x + 4 = 0 and explain what it tells us about the nature of the roots.',
    difficultyLevel: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.ANALYZE,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Identify a=3, b=-2, c=4 and use b²-4ac.' },
      { level: 2, text: '(-2)² - 4(3)(4) = 4 - 48 = -44.' },
      { level: 3, text: 'Since -44 < 0, the equation has two complex conjugate roots.' },
    ],
    shortAnswerExpected: 'The discriminant is (-2)²-4(3)(4) = 4-48 = -44. Since it is negative, the equation has two complex conjugate roots and no real solutions.',
  },
  // === Topic 2: Geometry - Triangles (LO 0 - Classify triangles) ===
  {
    topicIndex: 2, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'A triangle has sides measuring 5 cm, 5 cm, and 8 cm. What type of triangle is it?',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.REMEMBER,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Look at the side lengths. Are any sides equal?' },
      { level: 2, text: 'Two sides are equal (5 and 5). What do we call that?' },
      { level: 3, text: 'A triangle with exactly two equal sides is isosceles.' },
    ],
    options: [
      { text: 'Equilateral', isCorrect: false, rationale: 'All sides must be equal for equilateral.' },
      { text: 'Isosceles', isCorrect: true, rationale: 'Two sides are equal (5=5), so it is isosceles.' },
      { text: 'Scalene', isCorrect: false, rationale: 'Scalene requires all sides different.' },
      { text: 'Right', isCorrect: false, rationale: '5²+5²=50≠64=8², so it is not a right triangle.' },
    ],
  },
  // === Topic 2: Geometry - Triangles (LO 1 - Pythagorean theorem) ===
  {
    topicIndex: 2, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Use the Pythagorean theorem: a² + b² = c².' },
      { level: 2, text: '6² + 8² = 36 + 64 = 100.' },
      { level: 3, text: 'c = √100 = 10.' },
    ],
    options: [
      { text: '10', isCorrect: true, rationale: '√(36+64)=√100=10.' },
      { text: '14', isCorrect: false, rationale: '14 is just 6+8, not the hypotenuse.' },
      { text: '12', isCorrect: false, rationale: '12²=144≠100.' },
      { text: '√48', isCorrect: false, rationale: 'Incorrect calculation.' },
    ],
  },
  {
    topicIndex: 2, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'If the hypotenuse of a right triangle is 13 and one leg is 5, what is the other leg?',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'Use a² + b² = c² where c = 13 and a = 5.' },
      { level: 2, text: '25 + b² = 169, so b² = 144.' },
      { level: 3, text: 'b = √144 = 12.' },
    ],
    options: [
      { text: '8', isCorrect: false, rationale: '5²+8²=89≠169.' },
      { text: '10', isCorrect: false, rationale: '5²+10²=125≠169.' },
      { text: '12', isCorrect: true, rationale: '5²+12²=25+144=169=13². Correct!' },
      { text: '11', isCorrect: false, rationale: '5²+11²=146≠169.' },
    ],
  },
  // === Topic 2: Geometry - Triangles (LO 2 - Area of triangle) ===
  {
    topicIndex: 2, loIndex: 2,
    type: QuestionType.MCQ,
    stem: 'Calculate the area of a triangle with base 12 cm and height 9 cm.',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'The area formula for a triangle is A = ½ × base × height.' },
      { level: 2, text: 'A = ½ × 12 × 9.' },
      { level: 3, text: 'A = 54 cm².' },
    ],
    options: [
      { text: '54 cm²', isCorrect: true, rationale: '½ × 12 × 9 = 54.' },
      { text: '108 cm²', isCorrect: false, rationale: 'You forgot to multiply by ½.' },
      { text: '48 cm²', isCorrect: false, rationale: 'Incorrect calculation.' },
      { text: '36 cm²', isCorrect: false, rationale: 'Incorrect calculation.' },
    ],
  },
  {
    topicIndex: 2, loIndex: 2,
    type: QuestionType.SHORT_ANSWER,
    stem: 'A triangle has sides of length 7, 8, and 9 units. Use Heron\'s formula to calculate its area. Show your work.',
    difficultyLevel: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'First find the semi-perimeter: s = (a+b+c)/2.' },
      { level: 2, text: 's = (7+8+9)/2 = 12. Then A = √(s(s-a)(s-b)(s-c)).' },
      { level: 3, text: 'A = √(12 × 5 × 4 × 3) = √720 ≈ 26.83 square units.' },
    ],
    shortAnswerExpected: 's = (7+8+9)/2 = 12. A = √(12(12-7)(12-8)(12-9)) = √(12×5×4×3) = √720 ≈ 26.83 square units.',
  },
  // === Topic 3: Statistics & Probability (LO 0 - Mean, median, mode) ===
  {
    topicIndex: 3, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'Find the median of the data set: 3, 7, 9, 12, 15',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'The median is the middle value when data is ordered.' },
      { level: 2, text: 'The data is already ordered. There are 5 values.' },
      { level: 3, text: 'The 3rd value is the median: 9.' },
    ],
    options: [
      { text: '7', isCorrect: false, rationale: '7 is the second value, not the middle.' },
      { text: '9', isCorrect: true, rationale: 'With 5 values, the median is the 3rd: 9.' },
      { text: '9.2', isCorrect: false, rationale: '9.2 is the mean (46/5), not the median.' },
      { text: '12', isCorrect: false, rationale: '12 is the 4th value.' },
    ],
  },
  {
    topicIndex: 3, loIndex: 0,
    type: QuestionType.MULTI_SELECT,
    stem: 'The data set is: 2, 4, 4, 6, 8, 8, 10. Which of the following are correct? Select all that apply.',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Calculate each measure of central tendency separately.' },
      { level: 2, text: 'Mean = (2+4+4+6+8+8+10)/7 = 42/7 = 6. Median = 6 (4th value). Mode = 4 and 8 (bimodal).' },
      { level: 3, text: 'Check each statement against your calculations.' },
    ],
    options: [
      { text: 'The mean is 6', isCorrect: true, rationale: '42/7 = 6. Correct.' },
      { text: 'The median is 6', isCorrect: true, rationale: '4th value in ordered list of 7 is 6. Correct.' },
      { text: 'The mode is 4', isCorrect: true, rationale: '4 appears twice, which ties with 8 for most frequent.' },
      { text: 'The mode is 6', isCorrect: false, rationale: '6 appears only once.' },
      { text: 'The range is 8', isCorrect: true, rationale: '10 - 2 = 8. Correct.' },
    ],
  },
  // === Topic 3: Statistics & Probability (LO 1 - Probability) ===
  {
    topicIndex: 3, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'A bag contains 3 red balls, 4 blue balls, and 5 green balls. What is the probability of drawing a blue ball?',
    difficultyLevel: DifficultyLevel.EASY,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Count the total number of balls.' },
      { level: 2, text: 'Total = 3+4+5 = 12. Favorable outcomes = 4 blue.' },
      { level: 3, text: 'P(blue) = 4/12 = 1/3.' },
    ],
    options: [
      { text: '1/3', isCorrect: true, rationale: '4/12 = 1/3.' },
      { text: '1/4', isCorrect: false, rationale: 'This would be 3/12, the probability of red.' },
      { text: '4/12', isCorrect: false, rationale: 'Technically correct but 1/3 is the simplified form (both accepted in the real assessment, but MCQ format prefers simplified).' },
      { text: '1/2', isCorrect: false, rationale: 'That would require 6 blue balls.' },
    ],
  },
  {
    topicIndex: 3, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'Two dice are rolled. What is the probability that the sum is 7?',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'Total outcomes when rolling two dice = 6 × 6 = 36.' },
      { level: 2, text: 'Pairs summing to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 pairs.' },
      { level: 3, text: 'P(sum=7) = 6/36 = 1/6.' },
    ],
    options: [
      { text: '1/6', isCorrect: true, rationale: '6 favorable outcomes out of 36 total = 1/6.' },
      { text: '7/36', isCorrect: false, rationale: 'There are 6 favorable pairs, not 7.' },
      { text: '1/12', isCorrect: false, rationale: 'This would be 3/36, too few.' },
      { text: '1/4', isCorrect: false, rationale: '9/36 ≠ 6/36.' },
    ],
  },
  // === Topic 3: Statistics & Probability (LO 2 - Evaluate claims) ===
  {
    topicIndex: 3, loIndex: 2,
    type: QuestionType.SHORT_ANSWER,
    stem: 'A student claims that "the average score on the math test was 75, so most students scored around 75." Evaluate this claim. Under what conditions could it be misleading?',
    difficultyLevel: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.EVALUATE,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'Think about what "average" (mean) actually tells us vs. what it doesn\'t.' },
      { level: 2, text: 'Consider how outliers or skewed distributions affect the mean.' },
      { level: 3, text: 'A bimodal distribution (e.g., scores clustered at 50 and 100) could have mean 75 with no student scoring near 75.' },
    ],
    shortAnswerExpected: 'The claim is misleading because the mean can be affected by outliers and does not reflect the distribution shape. If scores are bimodal (e.g., many low and high scores), the mean could be 75 even though few students scored near it. The median or a histogram would give a more accurate picture.',
  },
  // Extra questions for variety
  {
    topicIndex: 0, loIndex: 0,
    type: QuestionType.MCQ,
    stem: 'If 4x - 3 = 2x + 9, what is x?',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'Move all x terms to one side.' },
      { level: 2, text: '4x - 2x = 9 + 3 → 2x = 12.' },
      { level: 3, text: 'x = 6.' },
    ],
    options: [
      { text: 'x = 3', isCorrect: false, rationale: '4(3)-3=9; 2(3)+9=15. Not equal.' },
      { text: 'x = 6', isCorrect: true, rationale: '4(6)-3=21; 2(6)+9=21. Equal!' },
      { text: 'x = 4', isCorrect: false, rationale: '4(4)-3=13; 2(4)+9=17. Not equal.' },
      { text: 'x = 5', isCorrect: false, rationale: '4(5)-3=17; 2(5)+9=19. Not equal.' },
    ],
  },
  {
    topicIndex: 2, loIndex: 1,
    type: QuestionType.SHORT_ANSWER,
    stem: 'A ladder 15 feet long leans against a wall. The base of the ladder is 9 feet from the wall. How high up the wall does the ladder reach? Explain your reasoning.',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'The ladder, wall, and ground form a right triangle.' },
      { level: 2, text: 'The ladder is the hypotenuse (15), the ground distance is one leg (9).' },
      { level: 3, text: 'height² = 15² - 9² = 225 - 81 = 144. Height = 12 feet.' },
    ],
    shortAnswerExpected: 'Using the Pythagorean theorem: height² + 9² = 15², so height² = 225 - 81 = 144, height = 12 feet.',
  },
  {
    topicIndex: 1, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'Using the quadratic formula, solve x² + 6x + 9 = 0. How many distinct real solutions are there?',
    difficultyLevel: DifficultyLevel.MEDIUM,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: false,
    hints: [
      { level: 1, text: 'Calculate the discriminant: b²-4ac.' },
      { level: 2, text: '36 - 36 = 0. What does discriminant = 0 mean?' },
      { level: 3, text: 'One repeated real root: x = -b/(2a) = -6/2 = -3.' },
    ],
    options: [
      { text: '0 real solutions', isCorrect: false, rationale: 'Discriminant is 0, not negative.' },
      { text: 'Exactly 1 (repeated root)', isCorrect: true, rationale: 'Discriminant = 0 means one repeated real root: x = -3.' },
      { text: '2 distinct real solutions', isCorrect: false, rationale: 'This requires discriminant > 0.' },
      { text: 'Infinitely many solutions', isCorrect: false, rationale: 'A quadratic has at most 2 roots.' },
    ],
  },
  // MCQ for probability - advanced
  {
    topicIndex: 3, loIndex: 1,
    type: QuestionType.MCQ,
    stem: 'A coin is flipped 3 times. What is the probability of getting exactly 2 heads?',
    difficultyLevel: DifficultyLevel.HARD,
    bloomLevel: BloomLevel.APPLY,
    isAiGenerated: true,
    hints: [
      { level: 1, text: 'List the total outcomes: 2³ = 8 possibilities.' },
      { level: 2, text: 'Favorable: HHT, HTH, THH = 3 outcomes.' },
      { level: 3, text: 'P = 3/8.' },
    ],
    options: [
      { text: '3/8', isCorrect: true, rationale: 'C(3,2) × (1/2)³ = 3/8.' },
      { text: '1/4', isCorrect: false, rationale: '2/8 = 1/4, but there are 3 favorable outcomes.' },
      { text: '1/2', isCorrect: false, rationale: 'P(exactly 2 heads) ≠ P(heads on one flip).' },
      { text: '1/3', isCorrect: false, rationale: 'This does not account for the sample space correctly.' },
    ],
  },
];

// ============================================================
// ASSESSMENT DEFINITIONS
// ============================================================

interface AssessmentDef {
  title: string;
  description: string;
  type: AssessmentType;
  timeLimitMinutes: number | null;
  hasRandomizedQuestions: boolean;
  // indices into QUESTIONS array for questions in this assessment
  questionIndices: number[];
  marksPerQuestion: number;
}

const ASSESSMENTS: AssessmentDef[] = [
  {
    title: 'Linear Equations Quiz',
    description: 'A quick quiz on solving linear equations in one variable',
    type: AssessmentType.QUIZ,
    timeLimitMinutes: 15,
    hasRandomizedQuestions: false,
    questionIndices: [0, 1, 2, 3],
    marksPerQuestion: 5,
  },
  {
    title: 'Algebra Fundamentals Exam',
    description: 'Comprehensive exam covering linear and quadratic equations',
    type: AssessmentType.EXAM,
    timeLimitMinutes: 45,
    hasRandomizedQuestions: true,
    questionIndices: [0, 2, 5, 6, 7, 8, 9],
    marksPerQuestion: 10,
  },
  {
    title: 'Quadratic Equations Practice',
    description: 'Practice set on factoring and solving quadratics',
    type: AssessmentType.PRACTICE,
    timeLimitMinutes: null,
    hasRandomizedQuestions: false,
    questionIndices: [5, 6, 7, 8, 9],
    marksPerQuestion: 5,
  },
  {
    title: 'Geometry — Triangles Quiz',
    description: 'Quiz on triangle classification, Pythagorean theorem, and area',
    type: AssessmentType.QUIZ,
    timeLimitMinutes: 20,
    hasRandomizedQuestions: false,
    questionIndices: [10, 11, 12, 13, 14],
    marksPerQuestion: 5,
  },
  {
    title: 'Statistics & Probability Quiz',
    description: 'Assessment on central tendency and basic probability',
    type: AssessmentType.QUIZ,
    timeLimitMinutes: 20,
    hasRandomizedQuestions: false,
    questionIndices: [15, 16, 17, 18, 19],
    marksPerQuestion: 5,
  },
  {
    title: 'Full Mathematics Midterm Exam',
    description: 'Mid-year examination covering all topics',
    type: AssessmentType.EXAM,
    timeLimitMinutes: 60,
    hasRandomizedQuestions: true,
    questionIndices: [0, 2, 5, 8, 10, 11, 14, 15, 17, 19],
    marksPerQuestion: 10,
  },
  {
    title: 'Pythagorean Theorem Deep Dive',
    description: 'Focused practice on applying the Pythagorean theorem',
    type: AssessmentType.PRACTICE,
    timeLimitMinutes: null,
    hasRandomizedQuestions: false,
    questionIndices: [11, 12, 20],
    marksPerQuestion: 10,
  },
  {
    title: 'Quick Algebra Review',
    description: 'Short review quiz before the midterm',
    type: AssessmentType.QUIZ,
    timeLimitMinutes: 10,
    hasRandomizedQuestions: true,
    questionIndices: [0, 1, 21],
    marksPerQuestion: 5,
  },
  {
    title: 'Probability Challenge',
    description: 'Advanced probability problems for enrichment',
    type: AssessmentType.PRACTICE,
    timeLimitMinutes: 30,
    hasRandomizedQuestions: false,
    questionIndices: [17, 18, 19, 23],
    marksPerQuestion: 10,
  },
  {
    title: 'Discriminant Analysis Assessment',
    description: 'Focused assessment on using the discriminant to classify roots',
    type: AssessmentType.QUIZ,
    timeLimitMinutes: 15,
    hasRandomizedQuestions: false,
    questionIndices: [8, 9, 22],
    marksPerQuestion: 10,
  },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function main() {
  console.log('==============================================');
  console.log('  Cerebro Synthetic Data Generation');
  console.log('==============================================\n');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // --------------------------------------------------------
  // 1. Create Super Admin (global)
  // --------------------------------------------------------
  console.log('[1/12] Creating Super Admin...');
  const superAdminTenant = await prisma.tenant.upsert({
    where: { slug: 'cerebro-platform' },
    update: {},
    create: {
      name: 'Cerebro Platform',
      slug: 'cerebro-platform',
      is_active: true,
    },
  });

  await prisma.user.upsert({
    where: {
      uq_users_tenant_email: {
        tenant_id: superAdminTenant.id,
        email: 'superadmin@cerebro.dev',
      },
    },
    update: {},
    create: {
      tenant_id: superAdminTenant.id,
      email: 'superadmin@cerebro.dev',
      password_hash: passwordHash,
      role: Role.SUPER_ADMIN,
      first_name: 'Super',
      last_name: 'Admin',
      is_active: true,
      is_verified: true,
    },
  });
  console.log('  -> superadmin@cerebro.dev / Password@123\n');

  // --------------------------------------------------------
  // 2. Create Schools (Tenants)
  // --------------------------------------------------------
  console.log('[2/12] Creating 3 schools...');

  for (let s = 0; s < SCHOOLS.length; s++) {
    const school = SCHOOLS[s];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`  SCHOOL ${s + 1}: ${school.name}`);
    console.log(`${'='.repeat(50)}`);

    // Create Tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: school.slug },
      update: {},
      create: {
        name: school.name,
        slug: school.slug,
        is_active: true,
      },
    });
    console.log(`  [OK] Tenant: ${tenant.name}`);

    // School Profile
    await prisma.schoolProfile.upsert({
      where: { tenant_id: tenant.id },
      update: {},
      create: {
        tenant_id: tenant.id,
        address: `${100 + s * 100} Education Blvd, Suite ${s + 1}`,
        phone: `+1-555-0${s + 1}00`,
        timezone: ['America/New_York', 'America/Chicago', 'America/Los_Angeles'][s],
      },
    });

    // --------------------------------------------------------
    // 3. School Admin
    // --------------------------------------------------------
    console.log('\n  [3/12] Creating School Admin...');
    const adminName = ADMIN_NAMES[s];
    const adminEmail = `admin@${school.slug}.edu`;
    const schoolAdmin = await prisma.user.upsert({
      where: {
        uq_users_tenant_email: { tenant_id: tenant.id, email: adminEmail },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        email: adminEmail,
        password_hash: passwordHash,
        role: Role.SCHOOL_ADMIN,
        first_name: adminName[0],
        last_name: adminName[1],
        is_active: true,
        is_verified: true,
      },
    });
    console.log(`    -> ${adminEmail} / Password@123`);

    // --------------------------------------------------------
    // 4. Academic Year, Grade, Section
    // --------------------------------------------------------
    console.log('\n  [4/12] Creating Academic Structure...');
    const academicYear = await prisma.academicYear.create({
      data: {
        tenant_id: tenant.id,
        name: '2025-2026',
        start_date: new Date('2025-08-01'),
        end_date: new Date('2026-06-30'),
        is_active: true,
      },
    });

    const grade = await prisma.grade.create({
      data: {
        tenant_id: tenant.id,
        academic_year_id: academicYear.id,
        name: 'Grade 10',
        level_number: 10,
      },
    });

    const section = await prisma.section.create({
      data: {
        tenant_id: tenant.id,
        grade_id: grade.id,
        name: 'Section A',
      },
    });
    console.log(`    -> ${academicYear.name} > ${grade.name} > ${section.name}`);

    // --------------------------------------------------------
    // 5. Mathematics Subject
    // --------------------------------------------------------
    console.log('\n  [5/12] Creating Mathematics Subject...');
    const mathSubject = await prisma.subject.upsert({
      where: {
        uq_subjects_tenant_code: { tenant_id: tenant.id, code: 'MATH-10' },
      },
      update: {},
      create: {
        tenant_id: tenant.id,
        name: 'Mathematics',
        code: 'MATH-10',
        description: 'Grade 10 Mathematics — Algebra, Geometry, Statistics & Probability',
        is_active: true,
      },
    });
    console.log(`    -> ${mathSubject.name} (${mathSubject.code})`);

    // --------------------------------------------------------
    // 6. Teachers
    // --------------------------------------------------------
    console.log('\n  [6/12] Creating 5 Teachers...');
    const teachers: { id: string; first_name: string; last_name: string; email: string }[] = [];
    for (let t = 0; t < 5; t++) {
      const tName = TEACHER_NAMES[t];
      const tEmail = `${tName[0].toLowerCase()}.${tName[1].toLowerCase()}@${school.slug}.edu`;
      const teacher = await prisma.user.upsert({
        where: {
          uq_users_tenant_email: { tenant_id: tenant.id, email: tEmail },
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          email: tEmail,
          password_hash: passwordHash,
          role: Role.TEACHER,
          first_name: tName[0],
          last_name: tName[1],
          is_active: true,
          is_verified: true,
        },
      });
      teachers.push(teacher);

      // Teacher-Subject Assignment
      await prisma.teacherSubjectAssignment.upsert({
        where: {
          uq_teacher_subject_tenant: {
            tenant_id: tenant.id,
            teacher_id: teacher.id,
            subject_id: mathSubject.id,
          },
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          teacher_id: teacher.id,
          subject_id: mathSubject.id,
        },
      });

      console.log(`    -> ${tEmail} / Password@123`);
    }

    // --------------------------------------------------------
    // 7. Classroom (teacher[0] teaches it)
    // --------------------------------------------------------
    console.log('\n  [7/12] Creating Classroom...');
    const classroom = await prisma.classroom.create({
      data: {
        tenant_id: tenant.id,
        section_id: section.id,
        subject_id: mathSubject.id,
        teacher_id: teachers[0].id,
        academic_year_id: academicYear.id,
        name: `Grade 10A — Mathematics`,
        is_active: true,
      },
    });
    console.log(`    -> ${classroom.name} (Teacher: ${teachers[0].first_name} ${teachers[0].last_name})`);

    // --------------------------------------------------------
    // 8. Students + Enrollment
    // --------------------------------------------------------
    console.log('\n  [8/12] Creating 5 Students...');
    const students: { id: string; first_name: string; last_name: string; email: string }[] = [];
    for (let st = 0; st < 5; st++) {
      const sName = STUDENT_NAMES[st];
      const sEmail = `${sName[0].toLowerCase()}.${sName[1].toLowerCase().replace("'", '')}@${school.slug}.edu`;
      const student = await prisma.user.upsert({
        where: {
          uq_users_tenant_email: { tenant_id: tenant.id, email: sEmail },
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          email: sEmail,
          password_hash: passwordHash,
          role: Role.STUDENT,
          first_name: sName[0],
          last_name: sName[1],
          is_active: true,
          is_verified: true,
        },
      });
      students.push(student);

      // Enroll
      await prisma.studentEnrollment.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          section_id: section.id,
          academic_year_id: academicYear.id,
          is_active: true,
        },
      });
      console.log(`    -> ${sEmail} / Password@123`);
    }

    // --------------------------------------------------------
    // 9. Topics, Learning Objectives, Competency Standards
    // --------------------------------------------------------
    console.log('\n  [9/12] Creating Curriculum (Topics, LOs, Standards)...');

    // Competency Standards
    const competencyStandards: { id: string; code: string }[] = [];
    for (const cs of COMPETENCY_STANDARDS) {
      const std = await prisma.competencyStandard.upsert({
        where: {
          uq_competency_standards_tenant_code: { tenant_id: tenant.id, code: cs.code },
        },
        update: {},
        create: {
          tenant_id: tenant.id,
          code: cs.code,
          title: cs.title,
          description: cs.description,
        },
      });
      competencyStandards.push(std);
    }
    console.log(`    -> ${competencyStandards.length} Competency Standards`);

    // Topics & Learning Objectives
    const allLOs: { id: string; topicIndex: number; loIndex: number }[] = [];
    for (let ti = 0; ti < MATH_TOPICS.length; ti++) {
      const topicDef = MATH_TOPICS[ti];
      const topic = await prisma.topic.create({
        data: {
          tenant_id: tenant.id,
          subject_id: mathSubject.id,
          name: topicDef.name,
          description: topicDef.description,
          order_index: ti + 1,
        },
      });

      for (let li = 0; li < topicDef.learningObjectives.length; li++) {
        const loDef = topicDef.learningObjectives[li];
        const lo = await prisma.learningObjective.create({
          data: {
            tenant_id: tenant.id,
            topic_id: topic.id,
            title: loDef.title,
            description: loDef.description,
            bloom_level: loDef.bloomLevel,
            order_index: li + 1,
          },
        });
        allLOs.push({ id: lo.id, topicIndex: ti, loIndex: li });

        // Map LOs to Competency Standards
        // Topic 0 (Algebra-Linear) -> CCSS.MATH.A.REI
        // Topic 1 (Algebra-Quadratic) -> CCSS.MATH.A.SSE
        // Topic 2 (Geometry) -> CCSS.MATH.G.SRT
        // Topic 3 (Stats) -> CCSS.MATH.S.ID + S.CP
        const csIndex = ti < 3 ? ti : (li < 2 ? 3 : 4);
        await prisma.loCompetencyMapping.create({
          data: {
            tenant_id: tenant.id,
            learning_objective_id: lo.id,
            competency_standard_id: competencyStandards[csIndex].id,
          },
        });
      }
      console.log(`    -> Topic: ${topicDef.name} (${topicDef.learningObjectives.length} LOs)`);
    }

    // LO Prerequisites: LO[1] requires LO[0] within each topic
    for (let ti = 0; ti < MATH_TOPICS.length; ti++) {
      const topicLOs = allLOs.filter(lo => lo.topicIndex === ti);
      for (let i = 1; i < topicLOs.length; i++) {
        await prisma.loPrerequisite.create({
          data: {
            tenant_id: tenant.id,
            source_lo_id: topicLOs[i].id,
            target_lo_id: topicLOs[i - 1].id,
          },
        });
      }
    }
    console.log(`    -> LO prerequisite chains created`);

    // --------------------------------------------------------
    // 10. Questions with Options & Hints
    // --------------------------------------------------------
    console.log('\n  [10/12] Creating Questions...');

    const questionIds: string[] = [];
    const questionOptionMap = new Map<string, { id: string; isCorrect: boolean }[]>();

    for (let qi = 0; qi < QUESTIONS.length; qi++) {
      const qDef = QUESTIONS[qi];
      const loRef = allLOs.find(lo => lo.topicIndex === qDef.topicIndex && lo.loIndex === qDef.loIndex);
      if (!loRef) throw new Error(`LO not found for question ${qi}`);

      const question = await prisma.question.create({
        data: {
          tenant_id: tenant.id,
          learning_objective_id: loRef.id,
          created_by_id: qDef.isAiGenerated ? teachers[0].id : teachers[randInt(0, 4)].id,
          type: qDef.type,
          stem: qDef.stem,
          difficulty_level: qDef.difficultyLevel,
          bloom_level: qDef.bloomLevel,
          is_ai_generated: qDef.isAiGenerated,
          review_status: ReviewStatus.APPROVED,
          hints: JSON.stringify(qDef.hints),
        },
      });
      questionIds.push(question.id);

      // Create options for MCQ / MULTI_SELECT
      if (qDef.options) {
        const createdOptions: { id: string; isCorrect: boolean }[] = [];
        for (let oi = 0; oi < qDef.options.length; oi++) {
          const optDef = qDef.options[oi];
          const option = await prisma.questionOption.create({
            data: {
              tenant_id: tenant.id,
              question_id: question.id,
              text: optDef.text,
              is_correct: optDef.isCorrect,
              rationale: optDef.rationale,
              order_index: oi + 1,
            },
          });
          createdOptions.push({ id: option.id, isCorrect: optDef.isCorrect });
        }
        questionOptionMap.set(question.id, createdOptions);
      }
    }
    const aiGenCount = QUESTIONS.filter(q => q.isAiGenerated).length;
    console.log(`    -> ${QUESTIONS.length} questions created (${aiGenCount} AI-generated)`);
    console.log(`    -> Types: ${QUESTIONS.filter(q => q.type === 'MCQ').length} MCQ, ${QUESTIONS.filter(q => q.type === 'MULTI_SELECT').length} MULTI_SELECT, ${QUESTIONS.filter(q => q.type === 'SHORT_ANSWER').length} SHORT_ANSWER`);

    // --------------------------------------------------------
    // 11. Assessments, Attempts, Responses
    // --------------------------------------------------------
    console.log('\n  [11/12] Creating Assessments & Student Attempts...');

    for (let ai = 0; ai < ASSESSMENTS.length; ai++) {
      const aDef = ASSESSMENTS[ai];
      const status = ai < 8 ? AssessmentStatus.PUBLISHED : (ai === 8 ? AssessmentStatus.CLOSED : AssessmentStatus.DRAFT);

      const assessment = await prisma.assessment.create({
        data: {
          tenant_id: tenant.id,
          classroom_id: classroom.id,
          created_by_id: teachers[ai % 5].id,
          title: aDef.title,
          description: aDef.description,
          type: aDef.type,
          status: status,
          due_at: aDef.type === AssessmentType.PRACTICE ? null : daysFromNow(30 - ai * 3),
          time_limit_minutes: aDef.timeLimitMinutes,
          has_randomized_questions: aDef.hasRandomizedQuestions,
          total_marks: aDef.questionIndices.length * aDef.marksPerQuestion,
        },
      });

      // Add questions to assessment
      for (let aqi = 0; aqi < aDef.questionIndices.length; aqi++) {
        const qIdx = aDef.questionIndices[aqi];
        await prisma.assessmentQuestion.create({
          data: {
            tenant_id: tenant.id,
            assessment_id: assessment.id,
            question_id: questionIds[qIdx],
            order_index: aqi + 1,
            marks: aDef.marksPerQuestion,
          },
        });
      }

      console.log(`    -> ${aDef.title} [${status}] (${aDef.questionIndices.length} questions, ${aDef.questionIndices.length * aDef.marksPerQuestion} marks)`);

      // Create student attempts for PUBLISHED and CLOSED assessments (first 9)
      if (status === AssessmentStatus.PUBLISHED || status === AssessmentStatus.CLOSED) {
        // Each student attempts this assessment
        const attemptStudents = ai < 6 ? students : students.slice(0, 3); // fewer students for later assessments
        for (const student of attemptStudents) {
          const daysOffset = randInt(5, 25);
          const attemptStatus = ai < 5 ? AttemptStatus.GRADED : (ai < 7 ? AttemptStatus.SUBMITTED : AttemptStatus.GRADED);
          const startedAt = daysAgo(daysOffset);
          const submittedAt = new Date(startedAt.getTime() + randInt(300, 2400) * 1000);

          let totalScore = 0;
          const totalMarks = aDef.questionIndices.length * aDef.marksPerQuestion;

          const attempt = await prisma.assessmentAttempt.create({
            data: {
              tenant_id: tenant.id,
              assessment_id: assessment.id,
              student_id: student.id,
              status: attemptStatus,
              started_at: startedAt,
              submitted_at: submittedAt,
              total_marks: totalMarks,
              score: null, // will update after creating responses
            },
          });

          // Create responses for each question
          for (const qIdx of aDef.questionIndices) {
            const qDef = QUESTIONS[qIdx];
            const qId = questionIds[qIdx];
            const timeSpent = randInt(15, 180);
            const hintLevel = Math.random() < 0.3 ? randInt(1, 3) : null; // 30% chance used hints

            let isCorrect: boolean | null = null;
            let marksAwarded: number | null = null;
            let textResponse: string | null = null;
            let aiScoreSuggestion: number | null = null;
            let aiConfidence: number | null = null;

            if (qDef.type === QuestionType.SHORT_ANSWER) {
              // Simulate varying quality short answers
              textResponse = qDef.shortAnswerExpected || 'Student response here';
              const quality = Math.random();
              aiScoreSuggestion = quality > 0.7 ? randFloat(0.7, 1.0) : (quality > 0.3 ? randFloat(0.3, 0.7) : randFloat(0.0, 0.3));
              aiConfidence = randFloat(0.5, 0.95);
              marksAwarded = Math.round(aiScoreSuggestion * aDef.marksPerQuestion * 100) / 100;
              isCorrect = aiScoreSuggestion >= 0.5;
            } else {
              // MCQ / MULTI_SELECT — simulate student answer
              isCorrect = Math.random() > (0.2 + (hintLevel ? 0.1 : 0)); // ~70-80% correct rate
              marksAwarded = isCorrect ? aDef.marksPerQuestion : 0;
            }

            totalScore += (marksAwarded ?? 0);

            const attemptResponse = await prisma.attemptResponse.create({
              data: {
                tenant_id: tenant.id,
                attempt_id: attempt.id,
                question_id: qId,
                text_response: textResponse,
                is_correct: isCorrect,
                marks_awarded: marksAwarded,
                time_spent_seconds: timeSpent,
                ai_score_suggestion: aiScoreSuggestion,
                ai_confidence: aiConfidence,
                hint_level_used: hintLevel,
              },
            });

            // Create option selections for MCQ/MULTI_SELECT
            if (qDef.type !== QuestionType.SHORT_ANSWER) {
              const options = questionOptionMap.get(qId);
              if (options) {
                if (isCorrect) {
                  // Select correct option(s)
                  const correctOptions = options.filter(o => o.isCorrect);
                  for (const opt of correctOptions) {
                    await prisma.attemptResponseSelection.create({
                      data: {
                        tenant_id: tenant.id,
                        attempt_response_id: attemptResponse.id,
                        option_id: opt.id,
                      },
                    });
                  }
                } else {
                  // Select a random wrong option
                  const wrongOptions = options.filter(o => !o.isCorrect);
                  if (wrongOptions.length > 0) {
                    const wrongOpt = pick(wrongOptions);
                    await prisma.attemptResponseSelection.create({
                      data: {
                        tenant_id: tenant.id,
                        attempt_response_id: attemptResponse.id,
                        option_id: wrongOpt.id,
                      },
                    });
                  }
                }
              }
            }

            // Create hint requests if hints were used
            if (hintLevel) {
              for (let hl = 1; hl <= hintLevel; hl++) {
                const hintDef = qDef.hints.find(h => h.level === hl);
                await prisma.hintRequest.create({
                  data: {
                    tenant_id: tenant.id,
                    student_id: student.id,
                    question_id: qId,
                    attempt_id: attempt.id,
                    hint_level: hl,
                    hint_text: hintDef?.text ?? `Level ${hl} hint for this question.`,
                    created_at: new Date(startedAt.getTime() + timeSpent * 500),
                  },
                });
              }
            }
          }

          // Update attempt score
          if (attemptStatus === AttemptStatus.GRADED) {
            await prisma.assessmentAttempt.update({
              where: { id: attempt.id },
              data: { score: Math.round(totalScore * 100) / 100 },
            });
          }
        }
      }
    }

    // --------------------------------------------------------
    // 12. Knowledge States, Telemetry
    // --------------------------------------------------------
    console.log('\n  [12/12] Creating Knowledge States & Telemetry...');

    // Knowledge States — one per student per LO
    for (const student of students) {
      for (const loRef of allLOs) {
        const mastery = randFloat(0.1, 0.95);
        const streakCount = mastery > 0.7 ? randInt(3, 8) : (mastery > 0.4 ? randInt(1, 3) : 0);
        const forgettingIndex = mastery > 0.7 ? randFloat(0.0, 0.3) : randFloat(0.3, 0.8);
        const attemptCount = randInt(2, 12);
        const daysUntilReview = mastery > 0.7 ? randInt(7, 30) : randInt(1, 5);

        await prisma.knowledgeState.create({
          data: {
            tenant_id: tenant.id,
            student_id: student.id,
            learning_objective_id: loRef.id,
            mastery_score: mastery,
            confidence: randFloat(0.4, 0.95),
            streak_count: streakCount,
            forgetting_index: forgettingIndex,
            attempt_count: attemptCount,
            last_attempt_at: daysAgo(randInt(1, 14)),
            next_review_at: daysFromNow(daysUntilReview),
          },
        });
      }
    }
    console.log(`    -> ${students.length * allLOs.length} Knowledge States created`);

    // Telemetry Events
    let telemetryCount = 0;
    for (const student of students) {
      const sessionId = uuid();
      const sessionStart = daysAgo(randInt(1, 10));

      // Session start
      await prisma.telemetryEvent.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          session_id: sessionId,
          event_type: TelemetryEventType.SESSION_STARTED,
          payload: { user_agent: 'Mozilla/5.0 Chrome/120', screen_resolution: '1920x1080' },
          occurred_at: sessionStart,
        },
      });
      telemetryCount++;

      // Assessment started
      await prisma.telemetryEvent.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          session_id: sessionId,
          event_type: TelemetryEventType.ASSESSMENT_STARTED,
          payload: { assessment_title: 'Linear Equations Quiz' },
          occurred_at: new Date(sessionStart.getTime() + 5000),
        },
      });
      telemetryCount++;

      // Question viewed events
      for (let qv = 0; qv < 4; qv++) {
        await prisma.telemetryEvent.create({
          data: {
            tenant_id: tenant.id,
            student_id: student.id,
            session_id: sessionId,
            event_type: TelemetryEventType.QUESTION_VIEWED,
            payload: { question_index: qv + 1 },
            occurred_at: new Date(sessionStart.getTime() + (10 + qv * 60) * 1000),
          },
        });
        telemetryCount++;

        // Option selected
        await prisma.telemetryEvent.create({
          data: {
            tenant_id: tenant.id,
            student_id: student.id,
            session_id: sessionId,
            event_type: TelemetryEventType.OPTION_SELECTED,
            payload: { question_index: qv + 1, option_index: randInt(1, 4) },
            occurred_at: new Date(sessionStart.getTime() + (30 + qv * 60) * 1000),
          },
        });
        telemetryCount++;
      }

      // Hint requested
      if (Math.random() < 0.5) {
        await prisma.telemetryEvent.create({
          data: {
            tenant_id: tenant.id,
            student_id: student.id,
            session_id: sessionId,
            event_type: TelemetryEventType.HINT_REQUESTED,
            payload: { question_index: 3, hint_level: 1 },
            occurred_at: new Date(sessionStart.getTime() + 200000),
          },
        });
        telemetryCount++;
      }

      // Assessment submitted
      await prisma.telemetryEvent.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          session_id: sessionId,
          event_type: TelemetryEventType.ASSESSMENT_SUBMITTED,
          payload: { duration_seconds: randInt(300, 1200) },
          occurred_at: new Date(sessionStart.getTime() + 600000),
        },
      });
      telemetryCount++;

      // Session ended
      await prisma.telemetryEvent.create({
        data: {
          tenant_id: tenant.id,
          student_id: student.id,
          session_id: sessionId,
          event_type: TelemetryEventType.SESSION_ENDED,
          payload: {},
          occurred_at: new Date(sessionStart.getTime() + 660000),
        },
      });
      telemetryCount++;
    }
    console.log(`    -> ${telemetryCount} Telemetry Events created`);
  }

  // --------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------
  console.log('\n' + '='.repeat(60));
  console.log('  GENERATION COMPLETE — SUMMARY');
  console.log('='.repeat(60));

  const counts = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.subject.count(),
    prisma.topic.count(),
    prisma.learningObjective.count(),
    prisma.competencyStandard.count(),
    prisma.loCompetencyMapping.count(),
    prisma.loPrerequisite.count(),
    prisma.question.count(),
    prisma.questionOption.count(),
    prisma.assessment.count(),
    prisma.assessmentQuestion.count(),
    prisma.assessmentAttempt.count(),
    prisma.attemptResponse.count(),
    prisma.attemptResponseSelection.count(),
    prisma.hintRequest.count(),
    prisma.knowledgeState.count(),
    prisma.telemetryEvent.count(),
    prisma.classroom.count(),
    prisma.studentEnrollment.count(),
  ]);

  const labels = [
    'Tenants', 'Users', 'Subjects', 'Topics', 'Learning Objectives',
    'Competency Standards', 'LO-Competency Mappings', 'LO Prerequisites',
    'Questions', 'Question Options', 'Assessments', 'Assessment Questions',
    'Assessment Attempts', 'Attempt Responses', 'Response Selections',
    'Hint Requests', 'Knowledge States', 'Telemetry Events',
    'Classrooms', 'Student Enrollments',
  ];

  for (let i = 0; i < labels.length; i++) {
    console.log(`  ${labels[i].padEnd(25)} ${counts[i]}`);
  }

  console.log('\n  Default password for ALL users: Password@123');
  console.log('\n  Schools:');
  for (const school of SCHOOLS) {
    console.log(`    - ${school.name} (admin@${school.slug}.edu)`);
  }
  console.log('  Super Admin: superadmin@cerebro.dev');
  console.log('\n' + '='.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n[FATAL] Synthetic data generation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
