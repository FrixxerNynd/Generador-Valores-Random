export class GetHistoryDto {
  userId!: string;
  action?: 'DEPOSIT' | 'BET' | 'WIN' | 'CONVERT_TO_CHIPS' | 'WITHDRAW';
  currencyType?: 'chips' | 'money';
  from?: string; // ISO date string
  to?: string;   // ISO date string
}
