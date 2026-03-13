export class ChipValue {
  static readonly CHIPS_PER_PESO = 10;

  static readonly PACKAGES: { price: number; chips: number }[] = [
    { price: 0, chips: 0},
    { price: 10, chips: 100 },
    { price: 60, chips: 600 },
    { price: 150, chips: 1500 },
    { price: 350, chips: 3500 },
    { price: 1000, chips: 10000 },
  ];

  static readonly CHIP_COLORS: { color: string; value: number }[] = [
    { color: 'Blanca', value: 1 },
    { color: 'Azul', value: 100 },
    { color: 'Roja', value: 500 },
    { color: 'Verde', value: 2500 },
    { color: 'Negra', value: 10000 },
    { color: 'Morada', value: 50000 },
    { color: 'Dorada', value: 100000 },
  ];
chips 
  static moneyToChips(money: number): number {
    return Math.floor(money * this.CHIPS_PER_PESO);
  }

  static chipsToMoney(chips: number): number {
    return chips / this.CHIPS_PER_PESO;
  }

  static getColorForValue(chipValue: number): string {
    const color = this.CHIP_COLORS.slice()
      .reverse()
      .find((c) => chipValue >= c.value);
    return color ? color.color : 'Blanca';
  }
}
