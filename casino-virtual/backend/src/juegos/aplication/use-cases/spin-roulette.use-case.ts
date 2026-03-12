import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RouletteSpin } from '../../domian/entities/roulette-spin.entity';
import { WALLET_CLIENT } from '../ports/wallet-client.port';
import type { WalletClientPort } from '../ports/wallet-client.port';
import { RouletteRulesValidator } from '../validators/roulette-rules.validator';
import { RouletteEngine } from '../../plugins/roulette/roulette.engine';

export interface SpinRouletteCommand {
  userId: string;
  selectedNumber: number;
  minRange: number;
  maxRange: number;
  betAmount: number;
  payoutMultiplier?: number;
  gameDescription?: string;
}

@Injectable()
export class SpinRouletteUseCase {
  constructor(
    @Inject(WALLET_CLIENT) private readonly walletClient: WalletClientPort,
    private readonly validator: RouletteRulesValidator,
    private readonly rouletteEngine: RouletteEngine,
  ) {}

  async execute(command: SpinRouletteCommand) {
    const payoutMultiplier = command.payoutMultiplier ?? 36;

    this.validator.ensureRange(command.minRange, command.maxRange);
    this.validator.ensureSelectedNumber(command.selectedNumber, command.minRange, command.maxRange);
    this.validator.ensureBetAmount(command.betAmount);

    const walletDebit = await this.walletClient.debit({
      userId: command.userId,
      chipsAmount: command.betAmount,
      gameDescription: command.gameDescription ?? 'Apuesta Ruleta',
    });

    const winningNumber = this.rouletteEngine.spin(command.minRange, command.maxRange);
    const isWinner = this.rouletteEngine.isWinner(command.selectedNumber, winningNumber);
    const payoutAmount = isWinner ? command.betAmount * payoutMultiplier : 0;

    let walletCredit: unknown | null = null;
    if (isWinner && payoutAmount > 0) {
      walletCredit = await this.walletClient.credit({
        userId: command.userId,
        chipsAmount: payoutAmount,
        gameDescription: 'Premio Ruleta',
      });
    }

    const spin: RouletteSpin = {
      spinId: randomUUID(),
      userId: command.userId,
      minRange: command.minRange,
      maxRange: command.maxRange,
      selectedNumber: command.selectedNumber,
      winningNumber,
      betAmount: command.betAmount,
      payoutMultiplier,
      payoutAmount,
      isWinner,
      createdAt: new Date(),
    };

    return {
      spin,
      wallet: {
        debited: walletDebit,
        credited: walletCredit,
      },
    };
  }
}
