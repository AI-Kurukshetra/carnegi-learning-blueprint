import { Injectable } from '@nestjs/common';
import { HintRequest } from '@prisma/client';
import { RequestUser } from '../../common/types/request-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHintRequestDto } from './dto/create-hint-request.dto';

@Injectable()
export class HintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    user: RequestUser,
    dto: CreateHintRequestDto,
  ): Promise<HintRequest> {
    return this.prisma.hintRequest.create({
      data: {
        tenant_id: tenantId,
        student_id: user.id,
        question_id: dto.question_id,
        attempt_id: dto.attempt_id,
        hint_level: dto.hint_level,
        hint_text:
          dto.hint_text ??
          `Hint level ${dto.hint_level} requested for question ${dto.question_id}`,
      },
    });
  }
}

