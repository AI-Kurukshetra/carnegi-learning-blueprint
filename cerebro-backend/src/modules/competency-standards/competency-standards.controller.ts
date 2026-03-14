import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompetencyStandardsService } from './competency-standards.service';
import { CreateCompetencyStandardDto } from './dto/create-competency-standard.dto';
import { ListCompetencyStandardsDto } from './dto/list-competency-standards.dto';
import { UpdateCompetencyStandardDto } from './dto/update-competency-standard.dto';

@Controller('competency-standards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompetencyStandardsController {
  constructor(
    private readonly competencyStandardsService: CompetencyStandardsService,
  ) {}

  @Get()
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findAll(
    @TenantId() tenantId: string,
    @Query() query: ListCompetencyStandardsDto,
  ) {
    return this.competencyStandardsService.findAll(tenantId, query);
  }

  @Post()
  @Roles(Role.SCHOOL_ADMIN)
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateCompetencyStandardDto,
  ) {
    return this.competencyStandardsService.create(tenantId, dto);
  }

  @Get(':id')
  @Roles(Role.SCHOOL_ADMIN, Role.TEACHER)
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.competencyStandardsService.findById(tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.SCHOOL_ADMIN)
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompetencyStandardDto,
  ) {
    return this.competencyStandardsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.SCHOOL_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.competencyStandardsService.remove(tenantId, id);
  }
}

