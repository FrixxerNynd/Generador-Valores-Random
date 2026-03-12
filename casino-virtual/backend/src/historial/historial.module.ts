import { Module } from '@nestjs/common';
import { HistorialController } from './infrastructure/historial.controller';
import { GetHistoryService } from './application/get-history.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [HistorialController],
  providers: [GetHistoryService],
})
export class HistorialModule {}
