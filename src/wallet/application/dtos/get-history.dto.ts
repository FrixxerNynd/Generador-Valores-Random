import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetHistoryDto {
  userId!: string;
  action?: 'DEPOSIT' | 'BET' | 'WIN' | 'CONVERT_TO_CHIPS' | 'WITHDRAW';
  currencyType?: 'chips' | 'money';
  from?: string; // ISO date string
  to?: string;   // ISO date string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number; // default: 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number; // default: 20
}
