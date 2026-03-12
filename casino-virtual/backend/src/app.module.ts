import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JuegosModule } from './juegos/juegos.module';

@Module({
  imports: [JuegosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
