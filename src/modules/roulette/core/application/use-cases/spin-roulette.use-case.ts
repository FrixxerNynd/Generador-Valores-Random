import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RouletteSpin } from '../../domain/entities/roulette-spin.entity';
import { RouletteDomainError, RouletteDomainErrorCode } from '../../domain/errors/roulette-domain.errors';
import { CreditWinInput, DebitBetInput, WALLET_CLIENT, WalletClientPort } from '../ports/wallet-client.port';
import { RouletteRulesValidator } from '../validators/roulette-rules.validator';
import { RouletteEngineService } from '../../../game-logic/roulette-engine.service';

export interface SpinRouletteCommand {
  userId: string;
  selectedNumber: number;
  minRange: number;
  maxRange: number;
  betAmount: number;
  payoutMultiplier?: number;
  gameDescription?: string;
}

export interface SpinRouletteResult {
  spin: RouletteSpin;
  wallet: {
    debited: unknown;
    credited: unknown | null;
  };
}

@Injectable()
export class SpinRouletteUseCase {
  constructor(
    @Inject(WALLET_CLIENT)
    private readonly walletClient: WalletClientPort,
    private readonly validator: RouletteRulesValidator,
    private readonly engine: RouletteEngineService,
  ) {}

  async execute(command: SpinRouletteCommand): Promise<SpinRouletteResult> {
    const payoutMultiplier = command.payoutMultiplier ?? 36;

    this.validator.ensureValidRange(command.minRange, command.maxRange);
    this.validator.ensureSelectedNumberInRange(
      command.selectedNumber,
      command.minRange,
      command.maxRange,
    );
    this.validator.ensureValidBetAmount(command.betAmount);
    this.validator.ensureValidPayoutMultiplier(payoutMultiplier);

    const debitInput: DebitBetInput = {
      userId: command.userId,
      chipsAmount: command.betAmount,
      gameDescription: command.gameDescription ?? 'Apuesta en Ruleta',
    };

    const debited = await this.walletClient.debitBet(debitInput);
    if (!debited) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.WALLET_DEBIT_FAILED,
        'No fue posible descontar fichas en Wallet.',
      );
    }

    const winningNumber = this.engine.spin(command.minRange, command.maxRange);
    const isWinner = this.engine.isWinningNumber(command.selectedNumber, winningNumber);
    const payoutAmount = isWinner
      ? this.engine.calculatePayout(command.betAmount, payoutMultiplier)
      : 0;

    let credited: unknown | null = null;
    if (isWinner && payoutAmount > 0) {
      const creditInput: CreditWinInput = {
        userId: command.userId,
        chipsAmount: payoutAmount,
        gameDescription: 'Premio Ruleta',
      };
      const creditResult = await this.walletClient.creditWin(creditInput);
      credited = creditResult.raw;
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
        debited: debited.raw,
        credited,
      },
    };
  }
}
