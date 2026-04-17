import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { ChipValue } from '../../domain/value-objects/chip-value.vo';

export interface WalletBalanceResponse {
  wallet: WalletEntity;
  chipsInMoney: number;
  chipColor: string;
  transactions: TransactionEntity[];
}

@Injectable()
export class GetBalanceService {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(userId: string): Promise<WalletBalanceResponse> {
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException(
        `Wallet no encontrada para el usuario ${userId}`,
      );
    }

    const transactions =
      await this.walletRepository.getTransactionsByUserId(userId);

    return {
      wallet,
      chipsInMoney: ChipValue.chipsToMoney(wallet.chips),
      chipColor: ChipValue.getColorForValue(wallet.chips),
      transactions,
    };
  }
}
