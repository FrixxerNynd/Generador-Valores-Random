import { IsNumber, IsNotEmpty, IsPositive, IsUUID } from 'class-validator';

export class WithdrawChipsDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsPositive()
  chipsAmount: number; // Fichas a retirar (se convierten a MXN)
}
