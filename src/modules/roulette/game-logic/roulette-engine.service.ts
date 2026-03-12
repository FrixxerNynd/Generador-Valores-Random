import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';

@Injectable()
export class RouletteEngineService {
  spin(minRange: number, maxRange: number): number {
    // randomInt uses [min, max), so maxRange + 1 is needed.
    return randomInt(minRange, maxRange + 1);
  }

  isWinningNumber(selectedNumber: number, winningNumber: number): boolean {
    return selectedNumber === winningNumber;
  }

  calculatePayout(betAmount: number, payoutMultiplier: number): number {
    return betAmount * payoutMultiplier;
  }
}
