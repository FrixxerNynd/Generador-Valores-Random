import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GetBalanceService } from '../../application/services/get-balance.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'wallet',
})
export class WalletGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly getBalanceService: GetBalanceService) {}

  // Emite actualización de saldo a un usuario específico
  emitBalanceUpdate(userId: string, chips: number, money: number) {
    this.server.to(`user:${userId}`).emit('balance_updated', {
      userId,
      chips,
      money,
      timestamp: new Date().toISOString(),
    });
  }

  // El cliente se une a su sala personal para recibir updates
  @SubscribeMessage('join_wallet_room')
  async handleJoinRoom(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await client.join(`user:${data.userId}`);

    // Enviar saldo actual al conectarse
    try {
      const balance = await this.getBalanceService.execute(data.userId);
      client.emit('balance_updated', {
        userId: data.userId,
        chips: balance.wallet.chips,
        money: balance.wallet.money,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Usuario sin wallet aún, enviar saldo en 0
      client.emit('balance_updated', {
        userId: data.userId,
        chips: 0,
        money: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
