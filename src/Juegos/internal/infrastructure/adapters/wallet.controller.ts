import {
  Controller,
  Get,
  Post,
  Body,
  Inject,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { WALLET_PORT, type WalletPort } from '../../domain/ports/wallet.port';
import { JwtAuthGuard } from '../../../../auth/infraestructure/guards/jwt-auth.guard';
import {
  getAuthenticatedUserId,
  getBearerTokenFromRequest,
} from '../../../../shared/utils/auth-user.util';

@Controller('wallet')
export class WalletController {
  constructor(@Inject(WALLET_PORT) private readonly walletPort: WalletPort) { }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Req() request: Request) {
    const userId = getAuthenticatedUserId(request);
    const accessToken = getBearerTokenFromRequest(request);
    const balance = await this.walletPort.getBalance(accessToken);
    return { userId, balance };
  }

  @Post('recharge')
  @UseGuards(JwtAuthGuard)
  async recharge(@Body() body: { amount: number }, @Req() request: Request) {
    const userId = getAuthenticatedUserId(request);
    const accessToken = getBearerTokenFromRequest(request);

    await this.walletPort.credit(accessToken, body.amount, 'Recarga manual');
    const balance = await this.walletPort.getBalance(accessToken);
    return { userId, balance, message: 'Recharge successful' };
  }
}
