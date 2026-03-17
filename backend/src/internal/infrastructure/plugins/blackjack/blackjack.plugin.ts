import { Injectable } from '@nestjs/common';
import { Bet, GamePlugin, GameResult } from '../../../domain/models/game.model';

@Injectable()
export class BlackjackPlugin implements GamePlugin {
  getName(): string {
    return 'blackjack';
  }

  async execute(bet: Bet): Promise<GameResult> {
    // Stub implementation for Blackjack
    // In a real scenario, this would involve card dealing logic
    const dealerScore = 17 + Math.floor(Math.random() * 5);
    const playerScore = 18 + Math.floor(Math.random() * 4);
    
    const isWinner = playerScore > dealerScore && playerScore <= 21;
    const payout = isWinner ? bet.amount * 2 : 0;

    return {
      winner: isWinner,
      payout: payout,
      winningSelection: { dealerScore, playerScore },
      message: isWinner ? '¡Ganaste al Dealer!' : 'El Dealer gana.',
    };
  }
}
