import { Injectable, Logger } from '@nestjs/common';
import { DepositChipsUseCase } from '../../application/use-cases/deposit-chips.use-case';
import { WalletGateway } from '../gateways/wallet.gateway';

// Este listener es llamado desde un controller de Stripe (no incluido en wallet module)
// Se inyecta como servicio para procesar pagos confirmados de Stripe

@Injectable()
export class StripeWebhookListener {
  private readonly logger = new Logger(StripeWebhookListener.name);

  // IDs de pagos ya procesados (idempotencia en memoria)
  // En producción usar Redis o Firestore
  private readonly processedPayments = new Set<string>();

  constructor(
    private readonly depositChipsUseCase: DepositChipsUseCase,
    private readonly walletGateway: WalletGateway,
  ) {}

  async handlePaymentSucceeded(event: {
    paymentIntentId: string;
    userId: string;
    amountMXN: number;
  }): Promise<void> {
    // Idempotencia: ignorar pagos ya procesados
    if (this.processedPayments.has(event.paymentIntentId)) {
      this.logger.warn(
        `Pago duplicado ignorado: ${event.paymentIntentId}`,
      );
      return;
    }

    try {
      const wallet = await this.depositChipsUseCase.execute({
        userId: event.userId,
        moneyAmount: event.amountMXN,
      });

      // Marcar como procesado
      this.processedPayments.add(event.paymentIntentId);

      // Notificar al cliente en tiempo real
      this.walletGateway.emitBalanceUpdate(
        event.userId,
        wallet.chips,
        wallet.money,
      );

      this.logger.log(
        `Pago procesado: ${event.paymentIntentId} — ${event.amountMXN} MXN para usuario ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error procesando pago ${event.paymentIntentId}: ${error.message}`,
      );
      throw error;
    }
  }
}
