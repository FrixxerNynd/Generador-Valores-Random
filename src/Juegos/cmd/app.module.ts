import { Module, Provider } from '@nestjs/common';
import { AppController } from '../pkg/app.controller';
import { AppService } from '../pkg/app.service';
import { AuthModule } from '../../auth/auth.module';
import { GameController } from '../internal/infrastructure/adapters/game.controller';
import { PlaceBetUseCase } from '../internal/application/usecases/place-bet.use-case';
import { WALLET_PORT } from '../internal/domain/ports/wallet.port';
import { WalletApiAdapter } from '../internal/infrastructure/adapters/wallet-api.adapter';
import { RoulettePlugin } from '../internal/infrastructure/plugins/roulette/roulette.plugin';
import { BlackjackPlugin } from '../internal/infrastructure/plugins/blackjack/blackjack.plugin';
import { PlinkoPlugin } from '../internal/infrastructure/plugins/plinko/plinko.plugin';

const GamePluginsProvider: Provider = {
  provide: 'GAME_PLUGINS',
  useFactory: (roulette: RoulettePlugin, blackjack: BlackjackPlugin, plinko: PlinkoPlugin) => {
    return [roulette, blackjack, plinko];
  },
  inject: [RoulettePlugin, BlackjackPlugin, PlinkoPlugin],
};

import { WalletController } from '../internal/infrastructure/adapters/wallet.controller';

@Module({
  imports: [AuthModule],
  controllers: [AppController, GameController, WalletController],
  providers: [
    AppService,
    PlaceBetUseCase,
    RoulettePlugin,
    BlackjackPlugin,
    PlinkoPlugin,
    {
      provide: WALLET_PORT,
      useClass: WalletApiAdapter,
    },
    {
      provide: 'GAME_PLUGINS',
      useFactory: (roulette: RoulettePlugin, blackjack: BlackjackPlugin, plinko: PlinkoPlugin) =>
        [roulette, blackjack, plinko],
      inject: [RoulettePlugin, BlackjackPlugin, PlinkoPlugin],
    },
  ],
})
export class GameModule {}
