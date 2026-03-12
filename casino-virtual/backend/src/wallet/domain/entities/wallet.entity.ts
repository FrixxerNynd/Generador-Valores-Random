import { InsufficientFundsError } from '../errors/insufficient-funds.error';

export class WalletEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public money: number, // Dinero real (MXN)
    public chips: number, // Fichas virtuales (10 fichas = $1 MXN)
  ) {}

  static create(userId: string): WalletEntity {
    return new WalletEntity('', userId, 0, 0);
  }

  depositMoney(amount: number): void {
    if (amount <= 0) throw new Error('El monto a depositar debe ser mayor a 0');
    this.money += amount;
  }

  convertMoneyToChips(moneyAmount: number): void {
    if (moneyAmount <= 0) throw new Error('El monto debe ser mayor a 0');
    if (moneyAmount > this.money)
      throw new InsufficientFundsError(
        `Saldo insuficiente. Tienes $${this.money} MXN`,
      );
    const chipsToAdd = moneyAmount * 10; // 10 fichas = $1 MXN
    this.money -= moneyAmount;
    this.chips += chipsToAdd;
  }

  deductChips(amount: number): void {
    if (amount <= 0) throw new Error('La apuesta debe ser mayor a 0');
    if (amount > this.chips)
      throw new InsufficientFundsError(
        `Fichas insuficientes. Tienes ${this.chips} fichas`,
      );
    this.chips -= amount;
  }

  creditChips(amount: number): void {
    if (amount <= 0) throw new Error('El premio debe ser mayor a 0');
    this.chips += amount;
  }

  withdrawChips(chipsAmount: number): void {
    if (chipsAmount <= 0) throw new Error('El retiro debe ser mayor a 0');
    if (chipsAmount > this.chips)
      throw new InsufficientFundsError(
        `Fichas insuficientes para retirar. Tienes ${this.chips} fichas`,
      );
    this.chips -= chipsAmount;
    this.money += chipsAmount / 10; // Convertir fichas → pesos MXN
  }

  get chipsInMoney(): number {
    return this.chips / 10;
  }
}
