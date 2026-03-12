export interface RouletteSpin {
  spinId: string;
  userId: string;
  minRange: number;
  maxRange: number;
  selectedNumber: number;
  winningNumber: number;
  betAmount: number;
  payoutMultiplier: number;
  payoutAmount: number;
  isWinner: boolean;
  createdAt: Date;
}
