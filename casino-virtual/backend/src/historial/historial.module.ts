import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Historial } from './domain/historial.entity';
import { AddHistoryService } from './application/add-history.service';
import { GetHistoryService } from './application/get-history.service';
import { GetUserHistoryService } from './application/get-user-history.service';
import { HistorialController } from './infrastructure/historial.controller';
import { SimulatorController } from './infrastructure/simulator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Historial])],
  controllers: [
    HistorialController,
    SimulatorController,
  ],
  providers: [

    AddHistoryService,
    GetHistoryService,
    GetUserHistoryService,
  ],
  exports: [AddHistoryService], // Exportamos AddHistoryService para que otros módulos lo usen
})
export class HistorialModule {}
