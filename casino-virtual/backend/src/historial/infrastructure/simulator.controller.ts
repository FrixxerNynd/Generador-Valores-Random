import { Controller, Post, Body } from '@nestjs/common';
import { AddHistoryService, CreateHistoryDto } from '../application/add-history.service';
import { CategoriaHistorial } from '../domain/historial.entity';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly addHistoryService: AddHistoryService) {}

  @Post('deposito')
  async simulateDeposito(@Body() body: { id_usuario: string; cantidad: number }) {
    const dto: CreateHistoryDto = {
      id_usuario: body.id_usuario || 'Id_314264857363',
      categoria: CategoriaHistorial.DEPOSITO,
      descripcion: `Se deposito dinero a la cuenta, ${body.cantidad || 100} pesos`,
      dinero: body.cantidad || 100,
    };
    return await this.addHistoryService.execute(dto);
  }

  @Post('conversion')
  async simulateConversion(@Body() body: { id_usuario: string; cantidad: number }) {
    const cantidad = body.cantidad || 100;
    const dto: CreateHistoryDto = {
      id_usuario: body.id_usuario || 'Id_314264857363',
      categoria: CategoriaHistorial.CONVERCION, // Manteniendo el typo del requerimiento original
      descripcion: `Se convierte ${cantidad} pesos a ${cantidad} fichas`,
      dinero: -cantidad,
      fichas: cantidad,
    };
    return await this.addHistoryService.execute(dto);
  }

  @Post('juego')
  async simulateJuego(
    @Body() body: { id_usuario: string; resuelto: boolean; nombre_juego: string; apuesta: number; ganancia?: number },
  ) {
    const juego = body.nombre_juego || '21';
    const apuesta = body.apuesta || 50;
    
    // Si resuelto es true, significa que el juego terminó y ganó o perdió. 
    // Si resuelto es false o no viene, es el inicio de la partida.
    if (body.hasOwnProperty('resuelto')) {
      if (body.resuelto) {
        // Ganó
        const ganancia = body.ganancia || apuesta * 2;
        return await this.addHistoryService.execute({
          id_usuario: body.id_usuario || 'Id_314264857363',
          categoria: CategoriaHistorial.JUEGO,
          descripcion: `Se gano el juego de ${juego}, gano ${ganancia} fichas`,
          fichas: ganancia,
        });
      } else {
        // Perdió
        return await this.addHistoryService.execute({
          id_usuario: body.id_usuario || 'Id_314264857363',
          categoria: CategoriaHistorial.JUEGO,
          descripcion: `Se perdio el juego de ${juego}, perdio las ${apuesta} fichas`,
          // Fichas no van en el registro de perder según el ejemplo del PDF
        });
      }
    } else {
      // Inicio del juego
      return await this.addHistoryService.execute({
        id_usuario: body.id_usuario || 'Id_314264857363',
        categoria: CategoriaHistorial.JUEGO,
        descripcion: `Se apostaron ${apuesta} fichas en el juego de ${juego}`,
        fichas: -apuesta,
      });
    }
  }
}
