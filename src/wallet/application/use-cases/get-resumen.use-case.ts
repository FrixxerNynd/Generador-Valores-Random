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
   * Reconstruye el balance al final de cada uno de los últimos N días
   * partiendo del balance actual y restrocediendo en el tiempo.
   *
   * Algoritmo:
   *   - balance[hoy] = wallet.chips  (conocido)
   *   - balance[ayer] = balance[hoy] - netChange[hoy]
   *   - balance[anteayer] = balance[ayer] - netChange[ayer]
   *   - ...
   */
  private computeBalanceEvolution(
    currentBalance: number,
    transactions: TransactionEntity[],
    days: number,
  ): PerformanceDayData[] {
    const today = new Date();
    const result: PerformanceDayData[] = [];
    let balance = currentBalance;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTx = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= dayStart && d <= dayEnd;
      });

      const label =
        i === 0
          ? 'Hoy'
          : date.toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
            });

      // Insertar al inicio para que el array quede ordenado ASC (más antiguo primero)
      result.unshift({ name: label, balance: Math.max(0, balance) });

      // Calcular cambio neto del día para poder retroceder al día anterior
      const netChange = dayTx.reduce((sum, t) => {
        if (['WIN', 'DEPOSIT', 'CONVERT_TO_CHIPS'].includes(t.action)) {
          return sum + t.amount;
        }
        if (['BET', 'WITHDRAW'].includes(t.action)) {
          return sum - t.amount;
        }
        return sum;
      }, 0);

      balance -= netChange;
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
