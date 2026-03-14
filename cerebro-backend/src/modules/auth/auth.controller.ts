import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RequestUser } from '../../common/types/request-user.type';
import { AuthService, LoginResponse, MeResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<{ access_token: string; refresh_token: string }> {
    return this.authService.refresh(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.authService.logout(user);
  }

  @Get('me')
  getMe(@CurrentUser() user: RequestUser): Promise<MeResponse> {
    return this.authService.getMe(user);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateMeDto,
  ): Promise<MeResponse> {
    return this.authService.updateMe(user, dto);
  }
}
