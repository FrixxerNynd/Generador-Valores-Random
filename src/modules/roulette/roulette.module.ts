import { Module } from '@nestjs/common';
import { RouletteController } from './api/http/roulette.controller';
import { WALLET_CLIENT } from './core/application/ports/wallet-client.port';
import { SpinRouletteUseCase } from './core/application/use-cases/spin-roulette.use-case';
import { RouletteRulesValidator } from './core/application/validators/roulette-rules.validator';
import { RouletteEngineService } from './game-logic/roulette-engine.service';
import { WalletApiClient } from './infrastructure/wallet/wallet-api.client';

@Module({
  controllers: [RouletteController],
  providers: [
    RouletteRulesValidator,
    RouletteEngineService,
    SpinRouletteUseCase,
    WalletApiClient,
    {
      provide: WALLET_CLIENT,
      useExisting: WalletApiClient,
    },
  ],
})
export class RouletteModule {}
