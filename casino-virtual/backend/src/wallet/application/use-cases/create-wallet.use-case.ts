import { Inject, Injectable, ConflictException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { CreateWalletDto } from '../dtos/create-wallet.dto';
import { WalletEntity } from '../../domain/entities/wallet.entity';

@Injectable()
export class CreateWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: CreateWalletDto): Promise<WalletEntity> {
    // Verificar que el usuario no tenga ya una wallet
    const existing = await this.walletRepository.findByUserId(dto.userId);
    if (existing) {
      throw new ConflictException(
        `El usuario ${dto.userId} ya tiene una wallet activa`,
      );
    }

    // Crear wallet con saldo en 0
    const newWallet = WalletEntity.create(dto.userId);
    return await this.walletRepository.create(newWallet);
  }
}
