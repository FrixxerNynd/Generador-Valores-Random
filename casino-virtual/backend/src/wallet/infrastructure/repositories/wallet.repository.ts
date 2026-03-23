import { Injectable, Inject } from '@nestjs/common';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import type { IWalletRepository, HistoryFilters } from '../../domain/repositories/wallet.repository.interface';
import { WALLET_REPOSITORY } from '../../domain/repositories/wallet.repository.interface';
import { WalletEntity } from '../../domain/entities/wallet.entity';
import { TransactionEntity } from '../../domain/entities/transaction.entity';
import { WalletDocument } from '../persistence/entities/wallet.orm-entity';
import { TransactionDocument } from '../persistence/entities/transaction.orm-entity';

export const FIRESTORE = 'FIRESTORE';

@Injectable()
export class WalletRepository implements IWalletRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  // ─── Wallet ──────────────────────────────────────────────

  async findByUserId(userId: string): Promise<WalletEntity | null> {
    const q = query(
      collection(this.db, 'Wallet'),
      where('Id_User', '==', userId),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as WalletDocument;

    return new WalletEntity(docSnap.id, data.Id_User, data.Money, data.Chips);
  }

  async create(wallet: WalletEntity): Promise<WalletEntity> {
    const docData: WalletDocument = {
      Id_User: wallet.userId,
      Money: wallet.money,
      Chips: wallet.chips,
    };
    const ref = await addDoc(collection(this.db, 'Wallet'), docData);
    return new WalletEntity(ref.id, wallet.userId, wallet.money, wallet.chips);
  }

  async update(wallet: WalletEntity): Promise<WalletEntity> {
    const docData: WalletDocument = {
      Id_User: wallet.userId,
      Money: wallet.money,
      Chips: wallet.chips,
    };
    await setDoc(doc(this.db, 'Wallet', wallet.id), docData);
    return wallet;
  }

  // ─── Transactions (History) ───────────────────────────────

  async saveTransaction(
    transaction: TransactionEntity,
  ): Promise<TransactionEntity> {
    const docData: TransactionDocument = {
      Id_User: transaction.userId,
      Action: transaction.action,
      Date: transaction.date.toISOString(),
      Description: transaction.description,
      Currency_Type: transaction.currencyType,
      Amount: transaction.amount,
    };
    const ref = await addDoc(collection(this.db, 'History'), docData);

    return new TransactionEntity(
      ref.id,
      transaction.userId,
      transaction.action,
      transaction.date,
      transaction.description,
      transaction.currencyType,
      transaction.amount,
    );
  }

  async getTransactionsByUserId(
    userId: string,
    filters?: HistoryFilters,
  ): Promise<TransactionEntity[]> {
    const q = query(
      collection(this.db, 'History'),
      where('Id_User', '==', userId),
    );
    const snapshot = await getDocs(q);

    let transactions = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as TransactionDocument;
      return new TransactionEntity(
        docSnap.id,
        data.Id_User,
        data.Action as TransactionEntity['action'],
        new Date(data.Date),
        data.Description,
        data.Currency_Type,
        data.Amount,
      );
    });

    // Aplicar filtros en memoria
    if (filters) {
      if (filters.action) {
        transactions = transactions.filter((t) => t.action === filters.action);
      }
      if (filters.currencyType) {
        transactions = transactions.filter(
          (t) => t.currencyType === filters.currencyType,
        );
      }
      if (filters.from) {
        transactions = transactions.filter(
          (t) => t.date >= filters.from!,
        );
      }
      if (filters.to) {
        transactions = transactions.filter(
          (t) => t.date <= filters.to!,
        );
      }
    }

    // Ordenar por fecha descendente
    return transactions.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }
}
