import { Module } from '@nestjs/common';
import { WALLET_CLIENT } from './aplication/ports/wallet-client.port';
import { SpinRouletteUseCase } from './aplication/use-cases/spin-roulette.use-case';
import { RouletteRulesValidator } from './aplication/validators/roulette-rules.validator';
import { RouletteController } from './infraestructure/controllers/roulette.controller';
import { WalletApiClient } from './infraestructure/external/wallet-api.client';
import { RouletteEngine } from './plugins/roulette/roulette.engine';

@Module({
  controllers: [RouletteController],
  providers: [
    SpinRouletteUseCase,
    RouletteRulesValidator,
    RouletteEngine,
    WalletApiClient,
    {
      provide: WALLET_CLIENT,
      useExisting: WalletApiClient,
    },
  ],
})
export class JuegosModule {}
