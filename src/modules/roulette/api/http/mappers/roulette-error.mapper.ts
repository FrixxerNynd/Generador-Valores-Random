import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RouletteDomainError, RouletteDomainErrorCode } from '../../../core/domain/errors/roulette-domain.errors';

export class RouletteErrorMapper {
  static toHttpException(error: unknown): HttpException {
    if (!(error instanceof RouletteDomainError)) {
      return new InternalServerErrorException({
        code: 'UNEXPECTED_ERROR',
        message: 'Ocurrió un error inesperado.',
      });
    }

    const payload = {
      code: error.code,
      message: error.message,
      details: error.details ?? null,
    };

    switch (error.code) {
      case RouletteDomainErrorCode.WALLET_API_URL_MISSING:
      case RouletteDomainErrorCode.WALLET_DEBIT_FAILED:
      case RouletteDomainErrorCode.WALLET_CREDIT_FAILED:
        return new ServiceUnavailableException(payload);
      default:
        return new BadRequestException(payload);
    }
  }
}
