import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolProfileModule } from './modules/school-profile/school-profile.module';
import { AcademicYearsModule } from './modules/academic-years/academic-years.module';
import { GradesModule } from './modules/grades/grades.module';
import { SectionsModule } from './modules/sections/sections.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TopicsModule } from './modules/topics/topics.module';
import { LearningObjectivesModule } from './modules/learning-objectives/learning-objectives.module';
import { CompetencyStandardsModule } from './modules/competency-standards/competency-standards.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { AssessmentAttemptsModule } from './modules/assessment-attempts/assessment-attempts.module';
import { HintsModule } from './modules/hints/hints.module';
import { KnowledgeStatesModule } from './modules/knowledge-states/knowledge-states.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { AiModule } from './modules/ai/ai.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProfileModule } from './modules/profile/profile.module';
import { StudentProgressModule } from './modules/student-progress/student-progress.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

const staticDir = join(process.cwd(), 'public');
const useServeStatic =
  process.env.NODE_ENV === 'production' && existsSync(staticDir);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: ['.env.development', '.env'],
    }),
    ...(useServeStatic
      ? [
          ServeStaticModule.forRoot({
            rootPath: staticDir,
            exclude: ['/api/{*path}'],
          }),
        ]
      : []),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    SchoolProfileModule,
    AcademicYearsModule,
    GradesModule,
    SectionsModule,
    ClassroomsModule,
    EnrollmentsModule,
    SubjectsModule,
    TopicsModule,
    LearningObjectivesModule,
    CompetencyStandardsModule,
    QuestionsModule,
    AssessmentsModule,
    AssessmentAttemptsModule,
    HintsModule,
    KnowledgeStatesModule,
    AnalyticsModule,
    TelemetryModule,
    AiModule,
    DashboardModule,
    ProfileModule,
    StudentProgressModule,
    InvoicesModule,
    OnboardingModule,
  ],
})
export class AppModule {}
