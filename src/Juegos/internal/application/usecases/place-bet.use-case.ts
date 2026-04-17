import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { WALLET_PORT } from '../../domain/ports/wallet.port';
import type { WalletPort } from '../../domain/ports/wallet.port';
import type { Bet, GameResult, GamePlugin } from '../../domain/models/game.model';

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(WALLET_PORT) private readonly walletPort: WalletPort,
    @Inject('GAME_PLUGINS') private readonly plugins: GamePlugin[],
  ) {}

  async execute(bet: Bet, accessToken: string): Promise<GameResult> {
    const plugin = this.plugins.find(p => p.getName() === bet.gameType);
    if (!plugin) {
      throw new NotFoundException(`Juego '${bet.gameType}' no soportado.`);
    }

    // 1. Verificar y Debitar Saldo
    const balance = await this.walletPort.getBalance(accessToken);
    if (balance < bet.amount) {
      throw new BadRequestException('Saldo insuficiente para realizar la apuesta.');
    }

    const gameLabel = plugin.getName().charAt(0).toUpperCase() + plugin.getName().slice(1);
    const debited = await this.walletPort.debit(accessToken, bet.amount, `Apuesta en ${gameLabel}`);
    if (!debited) {
      throw new Error('Error al procesar el débito en la billetera.');
    }

    // 2. Ejecutar Lógica del Juego
    const result = await plugin.execute(bet);

    // 3. Acreditar si ganó
    if (result.winner && result.payout > 0) {
      await this.walletPort.credit(
        accessToken,
        result.payout,
        `Premio ${gameLabel}: ${JSON.stringify(result.winningSelection)}`
      );
    }

    return result;
  }
}
