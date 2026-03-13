import { IsString, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class DepositChipsDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  moneyAmount?: number;

  @IsNumber()
  @IsOptional()
  packageIndex?: number; // Índice del paquete de fichas a comprar
}
