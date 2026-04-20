import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import type { TransactionEntity } from '../../domain/entities/transaction.entity';
import type { GetResumenDto } from '../dtos/get-resumen.dto';

export interface PerformanceDayData {
  name: string;    // "12 abr" o "Hoy"
  balance: number; // fichas al final del día
}

export interface DistributionItem {
  name: string;   // "Blackjack", "Ruleta", "Plinko"
  value: number;  // total fichas apostadas en ese juego
  color: string;  // color hex
}

export interface ResumenResponse {
  performanceData: PerformanceDayData[];
  distributionData: DistributionItem[];
  currentBalance: number;
  totalBet: number;
  totalWon: number;
}

// Mapeo interno: nombre del plugin (capitalizado) → nombre visible en español
const GAME_DISPLAY: Record<string, string> = {
  Blackjack: 'Blackjack',
  Roulette: 'Ruleta',
  Plinko: 'Plinko',
};

// Colores por juego (coinciden con los del frontend)
const GAME_COLORS: Record<string, string> = {
  Blackjack: '#3b82f6',
  Roulette: '#00F580',
  Plinko: '#C9962F',
};

@Injectable()
export class GetResumenUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: GetResumenDto): Promise<ResumenResponse> {
    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundException(
        `Wallet no encontrada para el usuario ${dto.userId}`,
      );
    }

    const days = dto.days ?? 7;
    const allTransactions = await this.walletRepository.getTransactionsByUserId(
      dto.userId,
    );

    const performanceData = this.computeBalanceEvolution(
      wallet.chips,
      allTransactions,
      days,
    );

    const distributionData = this.computeGameDistribution(allTransactions);

    const totalBet = allTransactions
      .filter((t) => t.action === 'BET')
      .reduce((s, t) => s + t.amount, 0);

    const totalWon = allTransactions
      .filter((t) => t.action === 'WIN')
      .reduce((s, t) => s + t.amount, 0);

    return {
      performanceData,
      distributionData,
      currentBalance: wallet.chips,
      totalBet,
      totalWon,
    };
  }

  /**
   * Reconstruye el balance de todos los movimientos
   * partiendo del balance actual y retrocediendo en el tiempo.
   * La gráfica mostrará cada movimiento (transacción) individualmente.
   */
  private computeBalanceEvolution(
    currentBalance: number,
    transactions: TransactionEntity[],
    days: number,
  ): PerformanceDayData[] {
    const today = new Date();
    const limitDate = new Date(today);
    limitDate.setDate(limitDate.getDate() - days);
    limitDate.setHours(0, 0, 0, 0);

    const result: PerformanceDayData[] = [];
    let balance = currentBalance;

    // Ordenar transacciones de más reciente a más antigua
    const sortedTx = [...transactions].sort((a, b) => {
      const db = new Date(b.date).getTime();
      const da = new Date(a.date).getTime();
      return db - da;
    });

    // Punto final: balance actual
    result.unshift({ name: 'Ahora', balance: Math.max(0, balance) });

    for (const tx of sortedTx) {
      const txDate = new Date(tx.date);

      // Si la transacción está en el rango de tiempo seleccionado, la añadimos a la gráfica
      if (txDate >= limitDate) {
        const label = txDate.toLocaleString('es-MX', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Insertamos al inicio para que el array quede ordenado de más antiguo a más reciente
        result.unshift({
          name: label,
          balance: Math.max(0, balance),
        });
      }

      // Deshacemos la transacción para conocer el balance ANTES de que ocurriera
      if (['WIN', 'DEPOSIT', 'CONVERT_TO_CHIPS'].includes(tx.action)) {
        balance -= tx.amount;
      } else if (['BET', 'WITHDRAW'].includes(tx.action)) {
        balance += tx.amount;
      }
    }

    return result;
  }

  /**
   * Agrupa las apuestas por tipo de juego.
   * El formato de descripción de un BET es: "Apuesta en Blackjack"
   */
  private computeGameDistribution(
    transactions: TransactionEntity[],
  ): DistributionItem[] {
    const gameMap: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.action !== 'BET') continue;

      // Extraer el nombre del juego: "Apuesta en Blackjack" → "Blackjack"
      const match = tx.description.match(/^Apuesta en (.+)$/);
      if (!match) continue;

      const rawName = match[1].trim();
      gameMap[rawName] = (gameMap[rawName] ?? 0) + tx.amount;
    }

    return Object.entries(gameMap)
      .filter(([, value]) => value > 0)
      .map(([rawName, value]) => ({
        name: GAME_DISPLAY[rawName] ?? rawName,
        value,
        color: GAME_COLORS[rawName] ?? '#a855f7',
      }));
  }
}
