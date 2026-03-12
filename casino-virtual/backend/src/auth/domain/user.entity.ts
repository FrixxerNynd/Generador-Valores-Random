export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly roles: string[],
    public readonly isActive: boolean,
  ) {}

  // añadir lógica de negocio o verificar si está baneado
  isAccountActive(): boolean {
    return this.isActive;
  }
}
