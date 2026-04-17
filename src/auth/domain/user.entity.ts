export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly last_name: string,
    public readonly nickname: string,
    public readonly born_date: Date,
    public readonly email: string,
    public readonly password: string,
    public readonly role: string,
    public readonly status: boolean,
  ) {}

  // Verificar si la cuenta está activa
  isAccountActive(): boolean {
    return this.status;
  }

  // Obtener nombre completo
  get fullName(): string {
    return `${this.name} ${this.last_name}`;
  }
}
