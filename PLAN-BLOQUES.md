# 🎯 Plan de Implementación por Bloques - Casino Virtual Login

## Resumen Ejecutivo

| Bloque | Prioridad | Status | Complejidad | Tiempo Est. |
|--------|-----------|--------|-------------|------------|
| **Bloque 1: Tests E2E** | 🔴 CRÍTICA | ✅ LISTO | ⭐ Baja | 1-2h |
| **Bloque 2: BD Real** | 🟠 Alta | ⏳ Pendiente | ⭐⭐ Media | 2-3h |
| **Bloque 3: OAuth Google** | 🟠 Alta | ⏳ Pendiente | ⭐⭐⭐ Alta | 4-6h |
| **Bloque 4: KYC (OCR + Biometría)** | 🟡 Media | ⏳ Pendiente | ⭐⭐⭐⭐⭐ Crítica | 2-3 semanas |
| **Bloque 5: Contador Online** | 🟡 Media | ⏳ Pendiente | ⭐⭐ Media | 3-4h |
| **Bloque 6: T&C (Términos)** | 🟡 Media | ⏳ Pendiente | ⭐ Baja | 2-3h |
| **Bloque 7: Lógica Negocio** | 🟢 Baja | ⏳ Pendiente | ⭐⭐ Media | 3-4h |

---

# 📦 BLOQUE 1: TESTS E2E ✅ (LISTO)

## Qué se hizo:
- ✅ Test de registro (validaciones, duplicados, campos)
- ✅ Test de login (credenciales, errores)
- ✅ Test de actualización de perfil (con token, errores)
- ✅ Validación de DTOs contra payloads inválidos
- ✅ Manejo de tokens JWT

## Cómo ejecutar:
```bash
# Todos los tests
npm run test:e2e

# Solo auth
npm run test:e2e -- auth.e2e-spec.ts

# Con watch
npm run test:e2e -- --watch
```

## Resultados esperados:
- 30+ tests pasando
- Cobertura de happy path y error cases
- Validación completa de DTOs

---

# 🗄️ BLOQUE 2: CONEXIÓN A BD REAL

## Qué se necesita:
- ✅ Credenciales de BD (host, usuario, contraseña, puerto)
- ✅ Nombre de la BD
- ✅ Tipo de BD (PostgreSQL, MySQL, MongoDB, etc)

## Qué se va a hacer:
1. **Instalar driver** (typeorm + driver específico)
   ```bash
   npm install @nestjs/typeorm typeorm pg # Para PostgreSQL
   ```

2. **Crear Entity TypeORM** 
   ```typescript
   @Entity('users')
   export class UserEntity {
     @PrimaryColumn('uuid')
     id: string;
     
     @Column('varchar', { length: 50 })
     name: string;
     
     // ... más campos
   }
   ```

3. **Crear PostgresAuthRepository**
   - Implementar `IAuthRepository`
   - Usar `Repository<UserEntity>` de TypeORM

4. **Actualizar auth.module.ts**
   - Agregar `TypeOrmModule.forRoot(...)`
   - Reemplazar provider de repository

5. **Crear migrations**
   ```bash
   npm run typeorm migration:generate src/migrations/Init
   npm run typeorm migration:run
   ```

## Tiempo estimado: **2-3 horas**

---

# 🔐 BLOQUE 3: OAUTH GOOGLE

## Arquitectura
```
Frontend                NestJS Backend              Google
   |                        |                         |
   +-- "Sign with Google"-> |                         |
   |                        +-- Intercambio Token --> |
   |                        |<-- ID Token + Info -----+
   |                        +-- Crear/Login Usuario -->
   |<-- JWT Local -----------+
   |                        |
```

## Qué se va a hacer:

1. **Instalar dependencias**
   ```bash
   npm install @nestjs/passport passport passport-google-oauth20
   npm install -D @types/passport-google-oauth20
   ```

2. **Crear estrategia Google**
   ```typescript
   // google.strategy.ts
   @Injectable()
   export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
     constructor() {
       super({
         clientID: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
         callbackURL: 'http://localhost:3000/auth/google/callback',
       });
     }
   
     async validate(accessToken, refreshToken, profile, done) {
       // Crear usuario si no existe
       const user = await this.findOrCreateUser(profile);
       done(null, user);
     }
   }
   ```

3. **Endpoints**
   ```
   GET /auth/google          → Redirige a Google
   GET /auth/google/callback → Google redirige aquí con token
   ```

4. **Retorno**
   ```json
   {
     "access_token": "jwt_local_token",
     "user": {
       "id": "uuid",
       "email": "user@gmail.com",
       "name": "John Doe"
     }
   }
   ```

## Variables de entorno necesarias:
```env
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

## Tiempo estimado: **4-6 horas**

---

# 👥 BLOQUE 4: CONTADOR DE USUARIOS EN LÍNEA

## Arquitectura con Redis
```
Usuario                NestJS App              Redis
   |                       |                     |
   +-- Login JWT -------> +                      |
   |                       +-- SET user:123 ---> |
   |                       |   (expire en 1h)    |
   |                       +-- INCR online_count +
   |                       |
   +-- GET /stats -------> +-- COUNT keys ------>|
   |<-- {online: 3842} ----+
```

## Qué se va a hacer:

1. **Instalar Redis**
   ```bash
   npm install @nestjs/cache-manager cache-manager redis
   ```

2. **Crear OnlineCountService**
   ```typescript
   @Injectable()
   export class OnlineCountService {
     constructor(private cacheManager: Cache) {}
     
     async addUser(userId: string) {
       await this.cacheManager.set(`online:${userId}`, true, 3600000);
     }
     
     async getOnlineCount(): Promise<number> {
       // Contar keys activas
     }
   }
   ```

3. **Integrar con LoginUseCase**
   - Cuando usuario hace login, registrarse en Redis

4. **Endpoint nuevo**
   ```
   GET /auth/stats → { onlineUsers: 3842 }
   ```

## Variables de entorno:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Tiempo estimado: **3-4 horas**

---

# 📝 BLOQUE 5: GESTIÓN DE TÉRMINOS Y CONDICIONES

## Estructura en BD
```sql
CREATE TABLE terms_accepted (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  terms_version VARCHAR(20),
  accepted_at TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);
```

## Qué se va a hacer:

1. **Create TermsService**
   ```typescript
   @Injectable()
   export class TermsService {
     async acceptTerms(userId: string, version: string) {
       // Guardar log de aceptación
     }
     
     async getLatestTerms() {
       // Retornar versión actual
     }
   }
   ```

2. **Agregar a RegisterDto**
   ```typescript
   @IsBoolean()
   acceptTerms: boolean;
   ```

3. **Nuevos endpoints**
   ```
   GET  /auth/terms        → Retorna versión actual
   POST /auth/terms/accept → Registra aceptación
   ```

## Tiempo estimado: **2-3 horas**

---

# 🆔 BLOQUE 4: KYC - Motor de Verificación de Identidad ⭐⭐⭐⭐⭐

**⚠️ ESTE ES EL MÁS COMPLEJO - REQUIERE COORDINACIÓN CON TERCEROS**

## Fase 1: Setup Inicial (1-2 días)

### Paso 1: Contratar servicios OCR
```
Opciones:
- Google Vision API ✅ Recomendado
- Amazon Rekognition
- Microsoft Computer Vision
```

**Setup Google Vision:**
```bash
npm install @google-cloud/vision
```

```typescript
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

const [result] = await client.documentTextDetection('image.jpg');
// Extrae: Nombre, CURP, Fecha de Nacimiento
```

### Paso 2: Servicio de validación INE
```
Necesita: API de tercero que valide contra INE
Ejemplos:
- OKVerify
- IDology
- Veriff
- Incognia
```

### Paso 3: Validación Biométrica (Face Match)
```
Opciones:
- AWS Rekognition Face Compare ✅
- Azure Face API
- Google Cloud Vision

Requiere: 2 imágenes (INE + Selfie)
Output: Confidence score (0-100)
```

## Fase 2: Arquitectura (2-3 días)

### Estructura de archivos y BD

**BD - Nueva tabla:**
```sql
CREATE TABLE kyc_verification (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  
  -- Documentos (URLs/IDs en S3)
  front_image_key VARCHAR(255),
  back_image_key VARCHAR(255),
  selfie_image_key VARCHAR(255),
  
  -- Datos extraídos del INE
  full_name VARCHAR(255),
  curp VARCHAR(18),
  date_of_birth DATE,
  issue_code VARCHAR(10),
  
  -- Validaciones
  ine_validation_status VARCHAR(50), -- valid, invalid, unknown
  liveness_score FLOAT,
  face_match_score FLOAT,
  confidence_score FLOAT,
  
  -- Estados
  status VARCHAR(50), -- pending, verified, rejected, manual_review
  reviewed_by UUID REFERENCES users(id),
  review_notes TEXT,
  
  -- Auditoría
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  reviewed_at TIMESTAMP
);

CREATE TABLE kyc_audit_log (
  id UUID PRIMARY KEY,
  kyc_id UUID REFERENCES kyc_verification(id),
  action VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP
);
```

### Use Cases necesarios:

1. **UploadDocumentUseCase**
   ```typescript
   async execute(userId, documentFile, type) {
     // Guardar en S3 encriptado
     // Retornar S3 key
   }
   ```

2. **ExtractOCRDataUseCase**
   ```typescript
   async execute(frontImageKey, backImageKey) {
     // Llamar Google Vision
     // Extraer CURP, nombre, fecha
     // Retornar datos
   }
   ```

3. **ValidateINEUseCase**
   ```typescript
   async execute(curp, issueCode) {
     // Llamar API INE de tercero
     // Validar contra BD oficial
     // Retornar válido/inválido
   }
   ```

4. **FaceMatchUseCase**
   ```typescript
   async execute(inePhotoKey, selfiePhotoKey) {
     // Llamar AWS Rekognition
     // Comparar rostros
     // Retornar confidence score
   }
   ```

5. **CompleteKYCUseCase**
   ```typescript
   async execute(userId) {
     // 1. Extract OCR
     // 2. Validate INE
     // 3. Face Match
     // 4. Calcular confidence score
     // 5. Si >= 90% → Auto-verified
     // 6. Si < 90% → Manual review
   }
   ```

## Fase 3: Endpoints (1-2 días)

```
POST   /kyc/upload-front          → Guardar frente del INE
POST   /kyc/upload-back           → Guardar reverso
POST   /kyc/upload-selfie         → Guardar selfie
POST   /kyc/verify                → Iniciar validación
GET    /kyc/status                → Estado actual
GET    /kyc/document/:id          → Retornar documento (solo owner)
```

## Fase 4: Almacenamiento Seguro (1-2 días)

### Encriptación AES-256
```bash
npm install crypto-js
```

```typescript
@Injectable()
export class EncryptionService {
  encrypt(data: Buffer): string {
    // AES-256
  }
  
  decrypt(encryptedData: string): Buffer {
    // AES-256
  }
}
```

### AWS S3 Setup
```bash
npm install aws-sdk
```

```typescript
s3.putObject({
  Bucket: 'private-kyc-bucket',
  Key: `kyc/${userId}/front.jpg.enc`, // Encriptado
  Body: encryptedBuffer,
  ServerSideEncryption: 'AES256',
})
```

## Fase 5: Gestión de Errores y Safety (2-3 días)

- Detección de fotocopias
- Detección de pantallas
- Validar que la cara coincida (liveness)
- Rate limiting en uploads
- Auditoría completa

## Cronología completa del KYC:

```
DÍA 1-2:  Contratar APIs (Google Vision, INE, Face)
DÍA 3-4:  Setup BD y encriptación
DÍA 5-8:  Implementar use cases
DÍA 9-10: Endpoints + S3
DÍA 11-12: Tests completos
DÍA 13-14: Auditoría de seguridad
```

## Tiempo estimado: **2-3 SEMANAS (depende de terceros)**

---

# 💰 BLOQUE 7: LÓGICA DE NEGOCIO

## Qué se va a hacer:

1. **Account Level Manager**
   ```typescript
   async promoteToVerified(userId: string) {
     // Cambiar de "basic" a "premium"
     // Actualizar daily_deposit_limit a 50,000 MXN
   }
   ```

2. **Deposit Limit Service**
   ```typescript
   async checkDepositLimit(userId: string, amount: number) {
     // Validar si usuario supera límite
     // Retornar true/false
   }
   ```

3. **Status Update después de KYC**
   ```typescript
   async updateUserAfterKYCVerification(userId: string) {
     user.accountLevel = 'premium';
     user.dailyDepositLimit = 50000;
     user.kycStatus = 'verified';
     await authRepository.update(user);
   }
   ```

## Tiempo estimado: **3-4 horas**

---

## 📅 Calendario Recomendado

```
SEMANA 1:
└─ LUN/MAR: Bloque 2 (BD Real)
└─ MIÉ/JUE: Bloque 3 (OAuth Google)
└─ VIE: Bloque 5 (Términos) + Bloque 7 (Lógica Negocio)

SEMANA 2:
└─ LUN/MAR: Bloque 4 (Contador Online)
└─ MIÉ-VIE: COMIENZA Bloque 4 (KYC)

SEMANA 3-4:
└─ KYC Completo
```

---

## ✅ Checklist Actual

- [x] Bloque 1: Tests E2E
- [ ] Bloque 2: BD Real (requiere credenciales)
- [ ] Bloque 3: OAuth Google
- [ ] Bloque 4: Contador Online
- [ ] Bloque 5: Términos y Condiciones
- [ ] Bloque 6: KYC (cuando tengan APIs)
- [ ] Bloque 7: Lógica de Negocio

---

## 📞 Próximos pasos

1. **Obtener credenciales de BD** → Proceder con Bloque 2
2. **Credenciales de Google OAuth** → Proceder con Bloque 3
3. **Decidir sobre KYC** → Contactar proveedores

¿Cuál es el siguiente bloque que quieres atacar?
