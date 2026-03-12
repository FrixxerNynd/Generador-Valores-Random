import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';

@Injectable()
export class RouletteEngine {
  spin(minRange: number, maxRange: number): number {
    return randomInt(minRange, maxRange + 1);
  }

  isWinner(selectedNumber: number, winningNumber: number): boolean {
    return selectedNumber === winningNumber;
  }
}
