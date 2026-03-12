export class SpinRouletteDto {
  userId!: string;
  selectedNumber!: number;
  minRange!: number;
  maxRange!: number;
  betAmount!: number;
  payoutMultiplier?: number;
  gameDescription?: string;
}
