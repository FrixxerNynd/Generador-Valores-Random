import { IsString, IsNotEmpty, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class ProcessBetDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsNumber()
  @IsPositive()
  chipsAmount: number; // Fichas a apostar

  @IsString()
  @IsNotEmpty()
  gameDescription: string; // Ej: "Apuesta en Ruleta"
}
