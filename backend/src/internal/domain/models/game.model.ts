export interface Bet {
  userId: string;
  amount: number;
  gameType: 'roulette' | 'blackjack';
  selection: any; // Dynamic selection (e.g., number for roulette)
}

export interface GameResult {
  winner: boolean;
  payout: number;
  winningSelection: any;
  message: string;
}

export interface GamePlugin {
  execute(bet: Bet): Promise<GameResult>;
  getName(): string;
}
