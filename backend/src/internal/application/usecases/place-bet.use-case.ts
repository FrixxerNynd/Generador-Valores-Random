import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { WALLET_PORT } from '../../domain/ports/wallet.port';
import type { WalletPort } from '../../domain/ports/wallet.port';
import { HISTORY_PORT } from '../../domain/ports/history.port';
import type { HistoryPort } from '../../domain/ports/history.port';
import type { Bet, GameResult, GamePlugin } from '../../domain/models/game.model';

@Injectable()
export class PlaceBetUseCase {
  constructor(
    @Inject(WALLET_PORT) private readonly walletPort: WalletPort,
    @Inject(HISTORY_PORT) private readonly historyPort: HistoryPort,
    @Inject('GAME_PLUGINS') private readonly plugins: GamePlugin[],
  ) {}

  async execute(bet: Bet): Promise<GameResult> {
    const plugin = this.plugins.find(p => p.getName() === bet.gameType);
    if (!plugin) {
      throw new NotFoundException(`Juego '${bet.gameType}' no soportado.`);
    }

    // 1. Verificar y Debitar Saldo
    const balance = await this.walletPort.getBalance(bet.userId);
    if (balance < bet.amount) {
      throw new BadRequestException('Saldo insuficiente para realizar la apuesta.');
    }

    const gameLabel = plugin.getName().charAt(0).toUpperCase() + plugin.getName().slice(1);
    const debited = await this.walletPort.debit(bet.userId, bet.amount, `Apuesta en ${gameLabel}`);
    if (!debited) {
      throw new Error('Error al procesar el débito en la billetera.');
    }

    // 2. Ejecutar Lógica del Juego
    const result = await plugin.execute(bet);

    // 3. Acreditar si ganó
    if (result.winner && result.payout > 0) {
      await this.walletPort.credit(
        bet.userId,
        result.payout,
        `Premio ${gameLabel}: ${JSON.stringify(result.winningSelection)}`
      );
    }

    // 4. Guardar en Historial
    await this.historyPort.saveRecord(
      bet.userId,
      bet.gameType,
      bet.amount,
      result.payout,
      JSON.stringify(result.winningSelection)
    );

    return result;
  }
}
