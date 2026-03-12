# 📊 Estructura Base de Datos - Módulo Auth

## TL;DR
Cuando tengas las credenciales de BD, solo necesitarás:
1. Crear un nuevo repository (ej: `PostgresAuthRepository`)
2. Reemplazar en `auth.module.ts` el provider de `IAuthRepository`
3. ¡Listo! El resto del código no cambia.

---

## 📋 Tabla de Usuarios (Propuesta)

### Estructura SQL Básica
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  roles VARCHAR(50)[] DEFAULT ARRAY['user'],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Campos para futuro
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, manual_review
  kyc_verification_date TIMESTAMP,
  account_level VARCHAR(50) DEFAULT 'basic', -- basic, premium
  daily_deposit_limit DECIMAL(12,2),
  terms_accepted_at TIMESTAMP,
  terms_version VARCHAR(20)
);

CREATE INDEX idx_email ON users(email);
CREATE INDEX idx_is_active ON users(is_active);
```

---

## 🔄 Interfaz del Repository (Ya Existe)

```typescript
export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

---

## 🗂️ Implementaciones Posibles

### 1️⃣ **InMemory** (Actual - Desarrollo)
```
✅ Funciona ahora
✅ Para tests
❌ No persiste datos
```

### 2️⃣ **PostgreSQL** (Recomendado para Producción)
```bash
npm install @nestjs/typeorm typeorm pg
```

**Archivo:** `postgres-auth.repository.ts`
```typescript
@Injectable()
export class PostgresAuthRepository implements IAuthRepository {
  constructor(private readonly repository: Repository<User>) {}
  
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }
  
  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }
  
  async save(user: User): Promise<void> {
    await this.repository.save(user);
  }
  
  async update(user: User): Promise<void> {
    await this.repository.update(user.id, user);
  }
  
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### 3️⃣ **MongoDB** (Alternativa)
```bash
npm install @nestjs/mongoose mongoose
```

---

## 🔧 Cómo Cambiar de Repository

### Paso 1: Crear nueva implementación
```typescript
// src/auth/infraestructure/repositories/postgres-auth.repository.ts
@Injectable()
export class PostgresAuthRepository implements IAuthRepository {
  // ... implementación
}
```

### Paso 2: Actualizar `auth.module.ts`
```typescript
@Module({
  // ... resto del módulo
  providers: [
    LoginUseCase,
    RegisterUseCase,
    UpdateUserUseCase,
    JwtAdapter,
    JwtAuthGuard,
    { provide: 'IPasswordHasher', useClass: BcryptAdapter },
    
    // CAMBIAR ESTA LÍNEA
    { provide: 'IAuthRepository', useClass: PostgresAuthRepository }, // 👈
  ],
})
export class AuthModule {}
```

### Paso 3: Actualizar TypeORM Module (si usas PostgreSQL)
```typescript
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User],
      synchronize: true, // false en producción
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'SECRETDEVUTD',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  // ...
})
export class AuthModule {}
```

---

## 📋 Campos del Usuario en la Aplicación

```typescript
export class User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  passwordHash: string;
  roles: string[]; // ['user', 'admin', 'moderator', etc]
  isActive: boolean;
  
  // Para futuro KYC
  kycStatus?: 'pending' | 'verified' | 'rejected' | 'manual_review';
  kycVerificationDate?: Date;
  accountLevel?: 'basic' | 'premium';
  dailyDepositLimit?: number;
  termsAcceptedAt?: Date;
  termsVersion?: string;
}
```

---

## 🚀 Próximos Pasos Cuando Tengas Credenciales

1. **Instalar driver de BD** (PostgreSQL, MongoDB, etc)
2. **Crear repository específico** siguiendo el patrón de `IAuthRepository`
3. **Reemplazar provider** en `auth.module.ts`
4. **Pasar variables de entorno** (`.env`)
5. **Ejecutar migrations** (si aplica)
6. **Ejecutar tests** para verificar

---

## 💡 Nota Importante

La estructura hexagonal permite que **el resto del código no cambie**:
- ✅ Controladores inalterados
- ✅ Use Cases inalterados
- ✅ DTOs inalterados
- ✅ Guards inalterados
- 🔄 Solo cambia el Repository (infraestructura)

Esto se llama **Inyección de Dependencias** y es el poder de esta arquitectura.
