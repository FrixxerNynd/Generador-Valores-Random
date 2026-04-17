import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { Bet, GamePlugin, GameResult } from '../../../domain/models/game.model';

type Risk = 'low' | 'medium' | 'high';
type Rows = 8 | 12 | 16;

const MULTIPLIERS: Record<Risk, Record<number, number[]>> = {
  low: {
    8:  [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    12: [10, 3, 1.6, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 1.6, 3, 10],
    16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1.0, 0.5, 1.0, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
  },
  medium: {
    8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
  },
  high: {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    12: [141, 26, 5.5, 2, 0.7, 0.2, 0.1, 0.2, 0.7, 2, 5.5, 26, 141],
    16: [999, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 999],
  },
};

const VALID_ROWS: Rows[] = [8, 12, 16];
const VALID_RISKS: Risk[] = ['low', 'medium', 'high'];

@Injectable()
export class PlinkoPlugin implements GamePlugin {
  getName(): string {
    return 'plinko';
  }

  async execute(bet: Bet): Promise<GameResult> {
    const rows: Rows = VALID_ROWS.includes(bet.selection?.rows)
      ? bet.selection.rows
      : 16;
    const risk: Risk = VALID_RISKS.includes(bet.selection?.risk)
      ? bet.selection.risk
      : 'medium';

    // Distribución binomial: cada fila la bola va izquierda (0) o derecha (1) con prob 50/50
    let bucketIndex = 0;
    for (let i = 0; i < rows; i++) {
      bucketIndex += randomInt(0, 2);
    }

    const multiplier = MULTIPLIERS[risk][rows][bucketIndex];
    const payout = Math.floor(bet.amount * multiplier);
    const winner = payout > 0;

    return {
      winner,
      payout,
      winningSelection: { bucketIndex, multiplier, rows, risk },
      message: winner
        ? `¡La bola cayó en ${multiplier}x! Ganaste ${payout} fichas.`
        : `La bola cayó en ${multiplier}x. Suerte la próxima.`,
    };
  }
}
