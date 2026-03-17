import { Module, Provider } from '@nestjs/common';
import { AppController } from '../pkg/app.controller';
import { AppService } from '../pkg/app.service';
import { GameController } from '../internal/infrastructure/adapters/game.controller';
import { PlaceBetUseCase } from '../internal/application/usecases/place-bet.use-case';
import { WALLET_PORT } from '../internal/domain/ports/wallet.port';
import { HISTORY_PORT } from '../internal/domain/ports/history.port';
import { WalletApiAdapter } from '../internal/infrastructure/adapters/wallet-api.adapter';
import { HistoryAdapter } from '../internal/infrastructure/adapters/history.adapter';
import { RoulettePlugin } from '../internal/infrastructure/plugins/roulette/roulette.plugin';
import { BlackjackPlugin } from '../internal/infrastructure/plugins/blackjack/blackjack.plugin';

const GamePluginsProvider: Provider = {
  provide: 'GAME_PLUGINS',
  useFactory: (roulette: RoulettePlugin, blackjack: BlackjackPlugin) => {
    return [roulette, blackjack];
  },
  inject: [RoulettePlugin, BlackjackPlugin],
};

import { WalletController } from '../internal/infrastructure/adapters/wallet.controller';

@Module({
  imports: [],
  controllers: [AppController, GameController, WalletController],
  providers: [
    AppService,
    PlaceBetUseCase,
    RoulettePlugin,
    BlackjackPlugin,
    {
      provide: WALLET_PORT,
      useClass: WalletApiAdapter,
    },
    {
      provide: HISTORY_PORT,
      useClass: HistoryAdapter,
    },
    {
      provide: 'GAME_PLUGINS',
      useFactory: (roulette: RoulettePlugin, blackjack: BlackjackPlugin) => [roulette, blackjack],
      inject: [RoulettePlugin, BlackjackPlugin],
    },
    // Override the useCase constructor injection if needed, 
    // but better to fix use-case to use @Inject('GAME_PLUGINS')
  ],
})
export class AppModule {}
