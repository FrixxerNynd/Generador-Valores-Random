import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IWalletRepository, HistoryFilters } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { GetHistoryDto } from '../dtos/get-history.dto';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

@Injectable()
export class GetHistoryUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: GetHistoryDto): Promise<TransactionEntity[]> {
    // Verificar que el usuario existe (tiene wallet)
    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundException(
        `Wallet no encontrada para el usuario ${dto.userId}`,
      );
    }

    // Construir filtros
    const filters: HistoryFilters = {};
    if (dto.action) filters.action = dto.action;
    if (dto.currencyType) filters.currencyType = dto.currencyType;
    if (dto.from) filters.from = new Date(dto.from);
    if (dto.to) filters.to = new Date(dto.to);

    return await this.walletRepository.getTransactionsByUserId(
      dto.userId,
      filters,
    );
  }

  async executeAdmin(): Promise<TransactionEntity[]> {
    return await this.walletRepository.getAllTransactions();
  }
}
