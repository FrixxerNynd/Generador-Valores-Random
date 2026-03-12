import { Injectable } from '@nestjs/common';
import { RouletteDomainError, RouletteDomainErrorCode } from '../../domain/errors/roulette-domain.errors';

@Injectable()
export class RouletteRulesValidator {
  ensureValidRange(minRange: number, maxRange: number): void {
    if (!Number.isInteger(minRange) || !Number.isInteger(maxRange) || minRange >= maxRange) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_RANGE,
        'El rango de ruleta es inválido.',
        { minRange, maxRange },
      );
    }
  }

  ensureSelectedNumberInRange(selectedNumber: number, minRange: number, maxRange: number): void {
    if (!Number.isInteger(selectedNumber) || selectedNumber < minRange || selectedNumber > maxRange) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_SELECTED_NUMBER,
        'El número seleccionado no está dentro del rango permitido.',
        { selectedNumber, minRange, maxRange },
      );
    }
  }

  ensureValidBetAmount(betAmount: number): void {
    if (!Number.isInteger(betAmount) || betAmount <= 0) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_BET_AMOUNT,
        'La apuesta debe ser un entero mayor a 0.',
        { betAmount },
      );
    }
  }

  ensureValidPayoutMultiplier(multiplier: number): void {
    if (!Number.isInteger(multiplier) || multiplier < 2) {
      throw new RouletteDomainError(
        RouletteDomainErrorCode.INVALID_BET_AMOUNT,
        'El multiplicador de pago debe ser un entero mayor o igual a 2.',
        { multiplier },
      );
    }
  }
}
