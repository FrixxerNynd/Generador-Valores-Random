import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { ProcessBetDto } from '../dtos/process-bet.dto';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

@Injectable()
export class ProcessBetUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: ProcessBetDto): Promise<WalletEntity> {
    // 1. Obtener wallet del usuario
    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundException(
        `Wallet no encontrada para el usuario ${dto.userId}`,
      );
    }

    // 2. Descontar fichas (lanza InsufficientFundsError si no hay suficientes)
    wallet.deductChips(dto.chipsAmount);

    // 3. Persistir
    const updated = await this.walletRepository.update(wallet);

    // 4. Registrar en historial
    const transaction = TransactionEntity.create(
      dto.userId,
      'BET',
      dto.gameDescription,
      'chips',
      dto.chipsAmount,
    );
    await this.walletRepository.saveTransaction(transaction);

    return updated;
  }
}
