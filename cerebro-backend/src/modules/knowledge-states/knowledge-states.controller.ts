import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { KnowledgeStatesService } from './knowledge-states.service';

@Controller('knowledge-states')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnowledgeStatesController {
  constructor(
    private readonly knowledgeStatesService: KnowledgeStatesService,
  ) {}

  @Get('my')
  @Roles(Role.STUDENT)
  findMy(@TenantId() tenantId: string, @CurrentUser() user: RequestUser) {
    return this.knowledgeStatesService.findMyKnowledgeStates(tenantId, user.id);
  }

  @Get('student/:student_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findByStudent(
    @TenantId() tenantId: string,
    @Param('student_id') studentId: string,
  ) {
    return this.knowledgeStatesService.findByStudent(tenantId, studentId);
  }

  @Get('class/:classroom_id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findByClassroom(
    @TenantId() tenantId: string,
    @Param('classroom_id') classroomId: string,
  ) {
    return this.knowledgeStatesService.findByClassroom(tenantId, classroomId);
  }
}

