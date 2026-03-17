import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PlaceBetUseCase } from '../../application/usecases/place-bet.use-case';
import { PlaceBetDto } from '../../application/dtos/place-bet.dto';
import type { GameResult } from '../../domain/models/game.model';

@Controller('games')
export class GameController {
  constructor(private readonly placeBetUseCase: PlaceBetUseCase) {}

  @Post('bet')
  @HttpCode(HttpStatus.OK)
  async placeBet(@Body() dto: PlaceBetDto): Promise<GameResult> {
    return this.placeBetUseCase.execute({
      userId: dto.userId,
      amount: dto.amount,
      gameType: dto.gameType as any,
      selection: dto.selection,
    });
  }
}
