import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
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
import { JwtAuthGuard } from '../../../auth/infraestructure/guards/jwt-auth.guard';
import { getAuthenticatedUserId } from '../../../shared/utils/auth-user.util';

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
    } catch (error: any) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── GET /wallet/me ────────────────────────────────────────
  // Consultar saldo + historial completo
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Req() request: Request) {
    try {
      const userId = getAuthenticatedUserId(request);
      return await this.getBalanceService.execute(userId);
    } catch (error: any) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── GET /wallet/me/history ────────────────────────────────
  // Historial con filtros opcionales
  // Query params: action, currencyType, from, to
  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  async getHistory(
    @Req() request: Request,
    @Query('action') action?: string,
    @Query('currencyType') currencyType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    try {
      const userId = getAuthenticatedUserId(request);
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
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deposit(@Body() dto: DepositChipsDto, @Req() request: Request) {
    try {
      const userId = getAuthenticatedUserId(request);
      const wallet = await this.depositChipsUseCase.execute({
        ...dto,
        userId,
      });
      return {
        message: `Depósito exitoso. Saldo: ${wallet.chips} fichas`,
        wallet,
      };
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async processBet(@Body() dto: ProcessBetDto, @Req() request: Request) {
    try {
      const userId = getAuthenticatedUserId(request);
      const wallet = await this.processBetUseCase.execute({
        ...dto,
        userId,
      });
      return {
        message: `Apuesta procesada. Saldo restante: ${wallet.chips} fichas`,
        wallet,
      };
    } catch (error: any) {
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
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async creditWinner(@Body() dto: CreditWinnerDto, @Req() request: Request) {
    try {
      const userId = getAuthenticatedUserId(request);
      const wallet = await this.creditWinnerUseCase.execute({
        ...dto,
        userId,
      });
      return {
        message: `Premio acreditado. Nuevo saldo: ${wallet.chips} fichas`,
        wallet,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── POST /wallet/withdraw ──────────────────────────────────
  // Retirar fichas → convertir a dinero real
  @Post('withdraw')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async withdraw(@Body() dto: WithdrawChipsDto, @Req() request: Request) {
    try {
      const userId = getAuthenticatedUserId(request);
      const wallet = await this.withdrawChipsUseCase.execute({
        ...dto,
        userId,
      });
      return {
        message: `Retiro exitoso. Fichas restantes: ${wallet.chips}`,
        wallet,
      };
    } catch (error: any) {
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
