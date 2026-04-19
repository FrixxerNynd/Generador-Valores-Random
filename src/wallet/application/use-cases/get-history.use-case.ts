import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IWalletRepository, HistoryFilters } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { GetHistoryDto } from '../dtos/get-history.dto';
import { TransactionEntity } from '../../domain/entities/transaction.entity';

export interface PaginatedHistory {
  userId: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  transactions: TransactionEntity[];
}

@Injectable()
export class GetHistoryUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: GetHistoryDto): Promise<PaginatedHistory> {
    const wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      throw new NotFoundException(
        `Wallet no encontrada para el usuario ${dto.userId}`,
      );
    }

    // Construir filtros de fecha/tipo
    const filters: HistoryFilters = {};
    if (dto.action) filters.action = dto.action;
    if (dto.currencyType) filters.currencyType = dto.currencyType;
    if (dto.from) filters.from = new Date(dto.from);
    if (dto.to) filters.to = new Date(dto.to);

    const all = await this.walletRepository.getTransactionsByUserId(
      dto.userId,
      filters,
    );

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const totalPages = Math.max(1, Math.ceil(all.length / limit));
    const offset = (page - 1) * limit;
    const transactions = all.slice(offset, offset + limit);

    return {
      userId: dto.userId,
      total: all.length,
      page,
      limit,
      totalPages,
      transactions,
    };
  }
}
