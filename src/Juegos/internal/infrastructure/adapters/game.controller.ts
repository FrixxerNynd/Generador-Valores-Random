import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { PlaceBetUseCase } from '../../application/usecases/place-bet.use-case';
import { PlaceBetDto } from '../../application/dtos/place-bet.dto';
import type { GameResult } from '../../domain/models/game.model';
import { JwtAuthGuard } from '../../../../auth/infraestructure/guards/jwt-auth.guard';
import {
  getAuthenticatedUserId,
  getBearerTokenFromRequest,
} from '../../../../shared/utils/auth-user.util';

@Controller('games')
export class GameController {
  constructor(private readonly placeBetUseCase: PlaceBetUseCase) {}

  @Post('bet')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async placeBet(
    @Body() dto: PlaceBetDto,
    @Req() request: Request,
  ): Promise<GameResult> {
    const userId = getAuthenticatedUserId(request);
    const accessToken = getBearerTokenFromRequest(request);

    return this.placeBetUseCase.execute({
      userId,
      amount: dto.amount,
      gameType: dto.gameType as any,
      selection: dto.selection,
    }, accessToken);
  }
}
