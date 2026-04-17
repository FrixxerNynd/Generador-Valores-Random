// Representa el documento de Firestore para la colección "History"
export interface TransactionDocument {
  id?: string;
  Id_User: string;
  Action: string;
  Date: string; // ISO string
  Description: string;
  Currency_Type: 'chips' | 'money';
  Amount: number;
}
