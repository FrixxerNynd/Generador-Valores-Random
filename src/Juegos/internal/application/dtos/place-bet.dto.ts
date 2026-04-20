import { IsString, IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class BetSelectionDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  value!: string | number;

  @IsNumber()
  @Min(0)
  amount!: number;
}

export class PlaceBetDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  gameType!: string;

  @IsOptional()
  selection?: BetSelectionDto[] | number | string | Record<string, any>; // Selection in Blackjack passes object with { action, token }
}
