import { IsString, IsNumber, IsNotEmpty, IsPositive, IsOptional } from 'class-validator';

export class BetSelectionDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  value!: string | number;

  @IsNumber()
  @IsPositive()
  amount!: number;
}

export class PlaceBetDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  gameType!: string;

  @IsOptional()
  selection?: BetSelectionDto[] | number | string;
}
