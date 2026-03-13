import { Injectable, NotFoundException } from '@nestjs/common';
import { GetHistoryUseCase } from '../../wallet/application/use-cases/get-history.use-case';

@Injectable()
export class GetHistoryService {
  constructor(private readonly walletGetHistoryUseCase: GetHistoryUseCase) {}

  private mapTransaction(t: any) {
    let categoria = 'Juego';
    if (t.action === 'DEPOSIT' || t.action === 'WITHDRAW') categoria = 'Deposito';
    if (t.action === 'CONVERT_TO_CHIPS') categoria = 'Convercion';

    const record: any = {
      id: t.id,
      idUsuario: t.userId,
      categoria,
      descripcion: t.description,
      fecha: t.date.toISOString(),
    };

    if (t.currencyType === 'money') {
      record.dinero = t.action === 'WITHDRAW' ? -t.amount : t.amount;
    } else {
      record.fichas = t.action === 'BET' ? -t.amount : t.amount;
    }

    if (t.action === 'CONVERT_TO_CHIPS') {
      record.fichas = t.amount;
      record.dinero = -(t.amount / 10);
    }

    return record;
  }

  async getUserHistory(userId: string) {
    let transactions: any[] = [];
    try {
      transactions = await this.walletGetHistoryUseCase.execute({ userId });
    } catch (error) {
      if (error instanceof NotFoundException) return [];
      throw error;
    }
    return transactions.map((t) => this.mapTransaction(t));
  }

  async getAdminHistory() {
    const transactions = await this.walletGetHistoryUseCase.executeAdmin();
    return transactions.map((t) => this.mapTransaction(t));
  }

  async exportAdminHistoryCsv(): Promise<string> {
    const rows = await this.getAdminHistory();
    const headers = ['id', 'idUsuario', 'categoria', 'descripcion', 'fecha', 'dinero', 'fichas'];
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const val = r[h] ?? '';
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
          })
          .join(','),
      ),
    ];
    return csvLines.join('\n');
  }
}
