import { Module } from '@nestjs/common';
import { RouletteModule } from './modules/roulette/roulette.module';

@Module({
  imports: [RouletteModule],
})
export class AppModule {}
