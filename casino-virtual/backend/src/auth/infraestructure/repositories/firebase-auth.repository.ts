import { Injectable, Inject } from '@nestjs/common';
import {
  Firestore,
  CollectionReference,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Query,
} from 'firebase-admin/firestore';
import type { IAuthRepository } from '../../domain/auth.repository.interface';
import { User } from '../../domain/user.entity';

export const FIRESTORE_AUTH = 'FIRESTORE_AUTH';

// Interface for the document stored in Firestore
interface UserDocument {
  Id: string;
  Name: string;
  Last_name: string;
  Nickname: string;
  Born_Date: string; // ISO string
  Email: string;
  Password: string;
  Role: string;
  Status: boolean;
}

@Injectable()
export class FirebaseAuthRepository implements IAuthRepository {
  private collection: CollectionReference;

  constructor(@Inject(FIRESTORE_AUTH) private readonly db: Firestore) {
    this.collection = this.db.collection('Users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('Email', '==', email).get();

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as UserDocument;

    return this.mapToUser(docSnap.id, data);
  }

  async findByNickname(nickname: string): Promise<User | null> {
    const snapshot = await this.collection
      .where('Nickname', '==', nickname)
      .get();

    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const data = docSnap.data() as UserDocument;

    return this.mapToUser(docSnap.id, data);
  }

  async findById(id: string): Promise<User | null> {
    const docRef = this.collection.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    const data = docSnap.data() as UserDocument;
    return this.mapToUser(docSnap.id, data);
  }

  async save(user: User): Promise<void> {
    const docData: UserDocument = {
      Id: user.id,
      Name: user.name,
      Last_name: user.last_name,
      Nickname: user.nickname,
      Born_Date: user.born_date.toISOString(),
      Email: user.email,
      Password: user.password,
      Role: user.role,
      Status: user.status,
    };

    await this.collection.doc(user.id).set(docData);
  }

  async update(user: User): Promise<void> {
    const docData: UserDocument = {
      Id: user.id,
      Name: user.name,
      Last_name: user.last_name,
      Nickname: user.nickname,
      Born_Date: user.born_date.toISOString(),
      Email: user.email,
      Password: user.password,
      Role: user.role,
      Status: user.status,
    };

    await this.collection.doc(user.id).set(docData);
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  private mapToUser(id: string, data: UserDocument): User {
    return new User(
      data.Id,
      data.Name,
      data.Last_name,
      data.Nickname,
      new Date(data.Born_Date),
      data.Email,
      data.Password,
      data.Role,
      data.Status,
    );
  }
}
