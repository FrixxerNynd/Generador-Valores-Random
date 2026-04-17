import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { DepositChipsDto } from '../dtos/deposit-chips.dto';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { ChipValue } from '../../domain/value-objects/chip-value.vo';

@Injectable()
export class DepositChipsUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(dto: DepositChipsDto): Promise<WalletEntity> {
    // ─── Resolver el monto según el modo ──────────────────
    const moneyAmount = this.resolveAmount(dto);

    // ─── Buscar o crear la wallet ──────────────────────────
    let wallet = await this.walletRepository.findByUserId(dto.userId);
    if (!wallet) {
      wallet = WalletEntity.create(dto.userId);
      wallet = await this.walletRepository.create(wallet);
    }

    // ─── Depositar y convertir a fichas ───────────────────
    wallet.depositMoney(moneyAmount);
    wallet.convertMoneyToChips(moneyAmount);

    // ─── Persistir ────────────────────────────────────────
    const updated = await this.walletRepository.update(wallet);

    // ─── Registrar en historial ───────────────────────────
    const chipsAdded = ChipValue.moneyToChips(moneyAmount);
    const description = dto.packageIndex !== undefined
      ? `Compra paquete #${dto.packageIndex + 1}: $${moneyAmount} MXN → ${chipsAdded} fichas`
      : `Conversión manual: $${moneyAmount} MXN → ${chipsAdded} fichas`;

    const transaction = TransactionEntity.create(
      dto.userId,
      'CONVERT_TO_CHIPS',
      description,
      'chips',
      chipsAdded,
    );
    await this.walletRepository.saveTransaction(transaction);

    return updated;
  }

  // ─── Resuelve cuánto dinero depositar según el modo ─────
  private resolveAmount(dto: DepositChipsDto): number {
    const hasPackage = dto.packageIndex !== undefined && dto.packageIndex !== null;
    const hasFreeAmount = dto.moneyAmount !== undefined && dto.moneyAmount !== null;

    // Validar que se envió al menos uno
    if (!hasPackage && !hasFreeAmount) {
      throw new BadRequestException(
        'Debes enviar "moneyAmount" (monto libre) o "packageIndex" (paquete 0-4)',
      );
    }

    // Modo paquete tiene prioridad si se envían ambos
    if (hasPackage) {
      const packages = ChipValue.PACKAGES;
      if (dto.packageIndex! < 0 || dto.packageIndex! >= packages.length) {
        throw new BadRequestException(
          `packageIndex inválido. Debe ser entre 0 y ${packages.length -1 }`,
        );
      }
      return packages[dto.packageIndex!].price;
    }

    // Modo libre
    if (dto.moneyAmount! <= 0) {
      throw new BadRequestException('moneyAmount debe ser mayor a 0');
    }
    return dto.moneyAmount!;
  }
}

