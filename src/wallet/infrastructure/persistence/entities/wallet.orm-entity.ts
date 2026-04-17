// Representa el documento de Firestore para la colección "Wallet"
export interface WalletDocument {
  id?: string;
  Id_User: string;
  Money: number;
  Chips: number;
}
