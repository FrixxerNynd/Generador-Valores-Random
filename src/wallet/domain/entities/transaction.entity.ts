export type TransactionAction = 'DEPOSIT' | 'BET' | 'WIN' | 'CONVERT_TO_CHIPS' | 'WITHDRAW';
export type CurrencyType = 'chips' | 'money';

export class TransactionEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly action: TransactionAction,
    public readonly date: Date,
    public readonly description: string,
    public readonly currencyType: CurrencyType,
    public readonly amount: number,
  ) {}

  static create(
    userId: string,
    action: TransactionAction,
    description: string,
    currencyType: CurrencyType,
    amount: number,
  ): TransactionEntity {
    return new TransactionEntity(
      '',
      userId,
      action,
      new Date(),
      description,
      currencyType,
      amount,
    );
  }
}
