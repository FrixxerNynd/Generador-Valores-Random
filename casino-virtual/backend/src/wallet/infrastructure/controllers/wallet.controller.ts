import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { GetBalanceService } from '../../application/services/get-balance.service';
import { DepositChipsUseCase } from '../../application/use-cases/deposit-chips.use-case';
import { ProcessBetUseCase } from '../../application/use-cases/process-bet.use-case';
import { CreditWinnerUseCase } from '../../application/use-cases/credit-winner.use-case';
import { CreateWalletUseCase } from '../../application/use-cases/create-wallet.use-case';
import { WithdrawChipsUseCase } from '../../application/use-cases/withdraw-chips.use-case';
import { GetHistoryUseCase } from '../../application/use-cases/get-history.use-case';
import { DepositChipsDto } from '../../application/dtos/deposit-chips.dto';
import { ProcessBetDto } from '../../application/dtos/process-bet.dto';
import { CreditWinnerDto } from '../../application/dtos/credit-winner.dto';
import { CreateWalletDto } from '../../application/dtos/create-wallet.dto';
import { WithdrawChipsDto } from '../../application/dtos/withdraw-chips.dto';
import { InsufficientFundsError } from '../../domain/errors/insufficient-funds.error';
import { ChipValue } from '../../domain/value-objects/chip-value.vo';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly getBalanceService: GetBalanceService,
    private readonly depositChipsUseCase: DepositChipsUseCase,
    private readonly processBetUseCase: ProcessBetUseCase,
    private readonly creditWinnerUseCase: CreditWinnerUseCase,
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly withdrawChipsUseCase: WithdrawChipsUseCase,
    private readonly getHistoryUseCase: GetHistoryUseCase,
  ) {}

  // ─── POST /wallet/create ────────────────────────────────────
  // Crear wallet para un usuario recién registrado
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createWallet(@Body() dto: CreateWalletDto) {
    try {
      const wallet = await this.createWalletUseCase.execute(dto);
      return {
        message: 'Wallet creada exitosamente',
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── GET /wallet/:userId ────────────────────────────────────
  // Consultar saldo + historial completo
  @Get(':userId')
  async getBalance(@Param('userId') userId: string) {
    try {
      return await this.getBalanceService.execute(userId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── GET /wallet/:userId/history ───────────────────────────
  // Historial con filtros opcionales
  // Query params: action, currencyType, from, to
  @Get(':userId/history')
  async getHistory(
    @Param('userId') userId: string,
    @Query('action') action?: string,
    @Query('currencyType') currencyType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    try {
      const transactions = await this.getHistoryUseCase.execute({
        userId,
        action: action as any,
        currencyType: currencyType as any,
        from,
        to,
      });
      return {
        userId,
        total: transactions.length,
        transactions,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── GET /wallet/packages ──────────────────────────────────
  // Paquetes disponibles de compra (no requiere userId)
  @Get('info/packages')
  getPackages() {
    return {
      exchangeRate: '10 fichas = $1.00 MXN',
      packages: ChipValue.PACKAGES,
      chipColors: ChipValue.CHIP_COLORS,
    };
  }

  // ─── POST /wallet/deposit ───────────────────────────────────
  // Depositar dinero y convertir a fichas
  @Post('deposit')
  @HttpCode(HttpStatus.OK)
  async deposit(@Body() dto: DepositChipsDto) {
    try {
      const wallet = await this.depositChipsUseCase.execute(dto);
      return {
        message: `Depósito exitoso. Saldo: ${wallet.chips} fichas`,
        wallet,
      };
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── POST /wallet/bet ───────────────────────────────────────
  // Descontar fichas al apostar
  @Post('bet')
  @HttpCode(HttpStatus.OK)
  async processBet(@Body() dto: ProcessBetDto) {
    try {
      const wallet = await this.processBetUseCase.execute(dto);
      return {
        message: `Apuesta procesada. Saldo restante: ${wallet.chips} fichas`,
        wallet,
      };
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── POST /wallet/credit ────────────────────────────────────
  // Acreditar fichas al ganador
  @Post('credit')
  @HttpCode(HttpStatus.OK)
  async creditWinner(@Body() dto: CreditWinnerDto) {
    try {
      const wallet = await this.creditWinnerUseCase.execute(dto);
      return {
        message: `Premio acreditado. Nuevo saldo: ${wallet.chips} fichas`,
        wallet,
      };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── POST /wallet/withdraw ──────────────────────────────────
  // Retirar fichas → convertir a dinero real
  @Post('withdraw')
  @HttpCode(HttpStatus.OK)
  async withdraw(@Body() dto: WithdrawChipsDto) {
    try {
      const wallet = await this.withdrawChipsUseCase.execute(dto);
      return {
        message: `Retiro exitoso. Fichas restantes: ${wallet.chips}`,
        wallet,
      };
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
