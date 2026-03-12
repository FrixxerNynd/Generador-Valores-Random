import { Body, Controller, Get, Post } from '@nestjs/common';
import { SpinRouletteUseCase } from '../../core/application/use-cases/spin-roulette.use-case';
import { SpinRouletteDto } from './dto/spin-roulette.dto';
import { RouletteErrorMapper } from './mappers/roulette-error.mapper';

@Controller('roulette')
export class RouletteController {
  constructor(private readonly spinRouletteUseCase: SpinRouletteUseCase) {}

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'roulette-backend',
    };
  }

  @Post('spin')
  async spin(@Body() body: SpinRouletteDto) {
    try {
      const result = await this.spinRouletteUseCase.execute(body);
      return {
        data: result,
      };
    } catch (error) {
      throw RouletteErrorMapper.toHttpException(error);
    }
  }
}
