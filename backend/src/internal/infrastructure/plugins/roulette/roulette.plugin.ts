import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Bet, GamePlugin, GameResult } from '../../../domain/models/game.model';

@Injectable()
export class RoulettePlugin implements GamePlugin {
  getName(): string {
    return 'roulette';
  }

  async execute(bet: Bet): Promise<GameResult> {
    const winningNumber = randomInt(0, 38); // 0-37
    const finalWinningNumber = winningNumber === 37 ? -1 : winningNumber;
    
    const selections = Array.isArray(bet.selection) ? bet.selection : [{ value: bet.selection, amount: bet.amount, type: 'straight' }];
    
    let totalPayout = 0;
    let isWinner = false;

    const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

    for (const s of selections) {
      let won = false;
      let multiplier = 0;

      if (s.type === 'straight') {
        if (s.value === finalWinningNumber) {
          won = true;
          multiplier = 36;
        }
      } else if (s.type === 'dozen') {
        if (s.value === '1st-12' && finalWinningNumber >= 1 && finalWinningNumber <= 12) won = true;
        else if (s.value === '2nd-12' && finalWinningNumber >= 13 && finalWinningNumber <= 24) won = true;
        else if (s.value === '3rd-12' && finalWinningNumber >= 25 && finalWinningNumber <= 36) won = true;
        multiplier = 3;
      } else if (s.type === 'outside') {
        if (s.value === 'even' && finalWinningNumber > 0 && finalWinningNumber % 2 === 0) won = true;
        else if (s.value === 'odd' && finalWinningNumber > 0 && finalWinningNumber % 2 !== 0) won = true;
        else if (s.value === 'red' && RED_NUMBERS.includes(finalWinningNumber)) won = true;
        else if (s.value === 'black' && finalWinningNumber > 0 && !RED_NUMBERS.includes(finalWinningNumber)) won = true;
        else if (s.value === '1-18' && finalWinningNumber >= 1 && finalWinningNumber <= 18) won = true;
        else if (s.value === '19-36' && finalWinningNumber >= 19 && finalWinningNumber <= 36) won = true;
        multiplier = 2;
      }

      if (won) {
        totalPayout += s.amount * multiplier;
        isWinner = true;
      }
    }

    return {
      winner: isWinner,
      payout: totalPayout,
      winningSelection: finalWinningNumber,
      message: isWinner ? `¡Felicidades! Salió el ${finalWinningNumber === -1 ? '00' : finalWinningNumber}.` : `Salió el ${finalWinningNumber === -1 ? '00' : finalWinningNumber}. Suerte la próxima.`,
    };
  }
}
