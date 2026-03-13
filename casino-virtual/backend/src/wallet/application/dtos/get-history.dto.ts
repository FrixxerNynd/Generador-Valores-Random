import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';

export class GetHistoryDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(['DEPOSIT', 'BET', 'WIN', 'CONVERT_TO_CHIPS', 'WITHDRAW'])
  @IsOptional()
  action?: 'DEPOSIT' | 'BET' | 'WIN' | 'CONVERT_TO_CHIPS' | 'WITHDRAW';

  @IsEnum(['chips', 'money'])
  @IsOptional()
  currencyType?: 'chips' | 'money';

  @IsDateString()
  @IsOptional()
  from?: string; // ISO date string

  @IsDateString()
  @IsOptional()
  to?: string; // ISO date string
}
