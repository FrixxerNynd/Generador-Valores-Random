import { Controller, Get, Post, Body, Param, Inject } from '@nestjs/common';
import { WALLET_PORT, type WalletPort } from '../../domain/ports/wallet.port';

@Controller('wallet')
export class WalletController {
  constructor(@Inject(WALLET_PORT) private readonly walletPort: WalletPort) { }

  @Get('balance/:userId')
  async getBalance(@Param('userId') userId: string) {
    const balance = await this.walletPort.getBalance(userId);
    return { userId, balance };
  }

  @Post('recharge')
  async recharge(@Body() body: { userId: string; amount: number }) {
    await this.walletPort.credit(body.userId, body.amount, 'Recarga manual');
    const balance = await this.walletPort.getBalance(body.userId);
    return { userId: body.userId, balance, message: 'Recharge successful' };
  }
}
