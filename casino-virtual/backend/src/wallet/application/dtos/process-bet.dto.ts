import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ProcessBetDto {
  userId!: string;

  @IsNumber()
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  chipsAmount!: number; // Fichas a apostar

  @IsString()
  @IsNotEmpty()
  gameDescription!: string; // Ej: "Apuesta en Ruleta"
}
