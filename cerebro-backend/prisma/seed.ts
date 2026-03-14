/**
 * Prisma Seed Script
 * Creates default tenant, super admin, and sample academic structure
 */

import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...\n');

  // 1. Default tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cerebro-demo' },
    update: {},
    create: {
      name: 'Cerebro Demo School',
      slug: 'cerebro-demo',
      is_active: true,
    },
  });
  console.log(`[OK] Tenant: ${tenant.name} (${tenant.id})`);

  // 2. School profile
  await prisma.schoolProfile.upsert({
    where: { tenant_id: tenant.id },
    update: {},
    create: {
      tenant_id: tenant.id,
      address: '123 Education Lane',
      phone: '+1-555-0100',
      timezone: 'America/New_York',
    },
  });
  console.log('[OK] School profile created');

  // 3. Super Admin user
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.upsert({
    where: {
      uq_users_tenant_email: {
        tenant_id: tenant.id,
        email: 'admin@cerebro.dev',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'admin@cerebro.dev',
      password_hash: passwordHash,
      role: Role.SUPER_ADMIN,
      first_name: 'Super',
      last_name: 'Admin',
      is_active: true,
      is_verified: true,
    },
  });
  console.log(`[OK] Super Admin: ${admin.email} (password: Admin@123)`);

  // 4. Sample teacher
  const teacherHash = await bcrypt.hash('Teacher@123', 10);
  const teacher = await prisma.user.upsert({
    where: {
      uq_users_tenant_email: {
        tenant_id: tenant.id,
        email: 'teacher@cerebro.dev',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'teacher@cerebro.dev',
      password_hash: teacherHash,
      role: Role.TEACHER,
      first_name: 'Jane',
      last_name: 'Smith',
      is_active: true,
      is_verified: true,
    },
  });
  console.log(`[OK] Teacher: ${teacher.email} (password: Teacher@123)`);

  // 5. Sample student
  const studentHash = await bcrypt.hash('Student@123', 10);
  const student = await prisma.user.upsert({
    where: {
      uq_users_tenant_email: {
        tenant_id: tenant.id,
        email: 'student@cerebro.dev',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      email: 'student@cerebro.dev',
      password_hash: studentHash,
      role: Role.STUDENT,
      first_name: 'John',
      last_name: 'Doe',
      is_active: true,
      is_verified: true,
    },
  });
  console.log(`[OK] Student: ${student.email} (password: Student@123)`);

  // 6. Academic year
  const academicYear = await prisma.academicYear.create({
    data: {
      tenant_id: tenant.id,
      name: '2025-2026',
      start_date: new Date('2025-08-01'),
      end_date: new Date('2026-06-30'),
      is_active: true,
    },
  });
  console.log(`[OK] Academic Year: ${academicYear.name}`);

  // 7. Sample subject
  const mathSubject = await prisma.subject.upsert({
    where: {
      uq_subjects_tenant_code: {
        tenant_id: tenant.id,
        code: 'MATH-101',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Mathematics',
      code: 'MATH-101',
      description: 'Foundational mathematics course',
      is_active: true,
    },
  });
  console.log(`[OK] Subject: ${mathSubject.name}`);

  const scienceSubject = await prisma.subject.upsert({
    where: {
      uq_subjects_tenant_code: {
        tenant_id: tenant.id,
        code: 'SCI-101',
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Science',
      code: 'SCI-101',
      description: 'General science course',
      is_active: true,
    },
  });
  console.log(`[OK] Subject: ${scienceSubject.name}`);

  // 8. Teacher-subject assignment
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
  console.log('[OK] Teacher assigned to Mathematics');

  // 9. Grade & Section
  const grade = await prisma.grade.create({
    data: {
      tenant_id: tenant.id,
      academic_year_id: academicYear.id,
      name: 'Grade 10',
      level_number: 10,
    },
  });
  console.log(`[OK] Grade: ${grade.name}`);

  const section = await prisma.section.create({
    data: {
      tenant_id: tenant.id,
      grade_id: grade.id,
      name: 'Section A',
    },
  });
  console.log(`[OK] Section: ${section.name}`);

  // 10. Classroom
  const classroom = await prisma.classroom.create({
    data: {
      tenant_id: tenant.id,
      section_id: section.id,
      subject_id: mathSubject.id,
      teacher_id: teacher.id,
      academic_year_id: academicYear.id,
      name: 'Grade 10A - Mathematics',
      is_active: true,
    },
  });
  console.log(`[OK] Classroom: ${classroom.name}`);

  // 11. Student enrollment
  await prisma.studentEnrollment.create({
    data: {
      tenant_id: tenant.id,
      student_id: student.id,
      section_id: section.id,
      academic_year_id: academicYear.id,
      is_active: true,
    },
  });
  console.log('[OK] Student enrolled in Section A');

  // 12. Sample topic & learning objective
  const topic = await prisma.topic.create({
    data: {
      tenant_id: tenant.id,
      subject_id: mathSubject.id,
      name: 'Algebra Basics',
      description: 'Introduction to algebraic expressions and equations',
      order_index: 1,
    },
  });
  console.log(`[OK] Topic: ${topic.name}`);

  await prisma.learningObjective.create({
    data: {
      tenant_id: tenant.id,
      topic_id: topic.id,
      title: 'Solve linear equations in one variable',
      description:
        'Students will be able to solve equations of the form ax + b = c',
      bloom_level: 'APPLY',
      order_index: 1,
    },
  });
  console.log('[OK] Learning Objective created');

  await prisma.learningObjective.create({
    data: {
      tenant_id: tenant.id,
      topic_id: topic.id,
      title: 'Identify algebraic expressions',
      description:
        'Students will be able to identify and classify algebraic expressions',
      bloom_level: 'UNDERSTAND',
      order_index: 2,
    },
  });
  console.log('[OK] Learning Objective created');

  console.log('\n=== Seed Complete ===');
  console.log('\nDefault credentials:');
  console.log('  Admin:   admin@cerebro.dev   / Admin@123');
  console.log('  Teacher: teacher@cerebro.dev / Teacher@123');
  console.log('  Student: student@cerebro.dev / Student@123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
