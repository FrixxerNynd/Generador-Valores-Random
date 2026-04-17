import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WalletModule } from './wallet/wallet.module';
import { GameModule } from './Juegos/cmd/app.module';
import { AuthModule } from './auth/auth.module';
// import { HistoryModule } from './history/history.module';

@Module({
  imports: [WalletModule, GameModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

