import { Injectable } from '@nestjs/common';
import { RouletteDomainError, RouletteDomainErrorCode } from '../../domian/errors/roulette-domain.errors';

@Injectable()
export class RouletteRulesValidator {
  ensureRange(minRange: number, maxRange: number): void {
    if (!Number.isInteger(minRange) || !Number.isInteger(maxRange) || minRange >= maxRange) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_RANGE,
        'El rango de ruleta es inválido.',
        { minRange, maxRange },
      );
    }
  }

  ensureSelectedNumber(selectedNumber: number, minRange: number, maxRange: number): void {
    if (
      !Number.isInteger(selectedNumber) ||
      selectedNumber < minRange ||
      selectedNumber > maxRange
    ) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_SELECTED_NUMBER,
        'El número seleccionado no está dentro del rango permitido.',
        { selectedNumber, minRange, maxRange },
      );
    }
  }

  ensureBetAmount(betAmount: number): void {
    if (!Number.isInteger(betAmount) || betAmount <= 0) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_BET_AMOUNT,
        'La apuesta debe ser un entero mayor a 0.',
        { betAmount },
      );
    }
  }
}
