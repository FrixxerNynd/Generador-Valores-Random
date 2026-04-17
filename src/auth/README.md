# 🔐 Módulo de Autenticación (`AuthModule`)

Responsable de la **identidad, seguridad y ciclo de vida** de los jugadores del casino. Gestiona registro, login, actualización de perfil y la emisión/validación de tokens JWT que protegen el resto del sistema.

---

## 📑 Tabla de Contenidos

1. [Responsabilidades](#-responsabilidades)
2. [Arquitectura interna](#-arquitectura-interna)
3. [Dominio](#-dominio)
4. [Casos de Uso](#-casos-de-uso)
5. [Infraestructura](#-infraestructura)
6. [API Endpoints](#-api-endpoints)
7. [JWT — Payload y uso](#-jwt--payload-y-uso)
8. [Seguridad de contraseñas](#-seguridad-de-contraseñas)
9. [Persistencia — Firebase Admin](#-persistencia--firebase-admin)
10. [Integración con Wallet](#-integración-con-wallet)
11. [Variables de entorno](#-variables-de-entorno)
12. [Flujos detallados](#-flujos-detallados)

---

## 🎯 Responsabilidades

| Función | Descripción |
|---|---|
| **Registro** | Crea el usuario, hashea la contraseña y genera su wallet inicial. |
| **Login** | Valida credenciales y emite un JWT (1 hora de validez). |
| **Actualización de perfil** | Permite editar nombre, apellido, nickname, email y contraseña desde una ruta protegida. |
| **Protección de rutas** | `JwtAuthGuard` valida el token en todos los módulos que lo importen. |
| **Resolución de identidad** | Todo el sistema (Wallet, Juegos) extrae el `userId` del token; ningún endpoint lo recibe por body o param. |

---

## 🏗️ Arquitectura interna

El módulo sigue **Arquitectura Hexagonal (Ports & Adapters)**:

```
┌──────────────────────────────────────────────────────────┐
│  INFRAESTRUCTURA                                         │
│  auth.controller  ·  jwt.adapter  ·  bcrypt.adapter      │
│  firebase-auth.repository  ·  wallet-api.client          │
│  jwt-auth.guard  ·  dtos                                 │
├──────────────────────────────────────────────────────────┤
│  APLICACIÓN (Casos de Uso)                               │
│  LoginUseCase  ·  RegisterUseCase  ·  UpdateUserUseCase  │
├──────────────────────────────────────────────────────────┤
│  DOMINIO                                                 │
│  User (entidad)  ·  IAuthRepository  ·  IPasswordHasher  │
└──────────────────────────────────────────────────────────┘
```

Los casos de uso solo dependen de **interfaces del dominio**, nunca de Firebase ni JWT directamente. Esto permite intercambiar la base de datos o el algoritmo de tokens sin tocar la lógica de negocio.

---

## 🧩 Dominio

### Entidad `User`

```typescript
class User {
  id: string;          // UUID generado al registrar
  name: string;
  last_name: string;
  nickname: string;    // Único en el sistema
  born_date: Date;
  email: string;       // Único en el sistema
  password: string;    // Hash bcrypt (nunca texto plano)
  role: string;        // 'user' | 'admin'
  status: boolean;     // true = activo, false = suspendido

  isAccountActive(): boolean
  get fullName(): string   // `${name} ${last_name}`
}
```

### Puerto `IAuthRepository`

Interfaz que desacopla la lógica del mecanismo de persistencia:

```typescript
interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findByNickname(nickname: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### Puerto `IPasswordHasher`

```typescript
interface IPasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
```

---

## ⚙️ Casos de Uso

### `RegisterUseCase`

Orquesta el registro completo de un nuevo jugador.

**Pasos:**
1. Verifica que el **email** no esté en uso.
2. Verifica que el **nickname** no esté en uso.
3. Hashea la contraseña con `bcrypt`.
4. Genera un `UUID` único para el usuario.
5. Persiste el `User` en Firestore.
6. Llama a `WalletApiClient` → `POST /api/wallet/create` para crear la wallet inicial.
7. Retorna `{ id, email, name, nickname, wallet: { chips: 0, money: 0 } }`.

**Errores lanzados:**
- `BadRequestException` — email o nickname ya registrado.
- `BadRequestException` — fecha de nacimiento inválida.
- `InternalServerErrorException` — error inesperado en persistencia.

---

### `LoginUseCase`

Valida credenciales y emite el token de sesión.

**Pasos:**
1. Busca el usuario por email en Firestore.
2. Verifica que la cuenta esté activa (`status === true`).
3. Compara la contraseña con el hash almacenado (`bcrypt.compare`).
4. Firma un JWT con payload `{ sub: userId, email, role }`.
5. Retorna `{ access_token: "eyJ..." }`.

**Errores lanzados:**
- `UnauthorizedException` — credenciales inválidas o cuenta inactiva.

---

### `UpdateUserUseCase`

Permite modificar datos del perfil desde una ruta protegida con JWT.

**Campos actualizables:**

| Campo | Validación |
|---|---|
| `name` | String, 2–50 chars |
| `last_name` | String, 2–50 chars |
| `nickname` | String, 3–20 chars, único |
| `email` | Email válido, único |
| `password` | String, 6–128 chars (se re-hashea) |

**Pasos:**
1. Verifica que el usuario exista por `userId` (extraído del token).
2. Si cambia email, verifica unicidad.
3. Si cambia nickname, verifica unicidad.
4. Si cambia contraseña, la re-hashea con `bcrypt`.
5. Persiste el `User` actualizado.
6. Retorna `{ id, email, name, nickname }`.

**Errores lanzados:**
- `NotFoundException` — usuario no encontrado.
- `BadRequestException` — email o nickname ya en uso.

---

## 🔧 Infraestructura

### `auth.controller.ts`

Expone los tres endpoints públicos y protegidos del módulo.

| Método | Ruta | Guard | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Pública | Registro de nuevo jugador |
| `POST` | `/api/auth/login` | ❌ Pública | Login, retorna JWT |
| `PATCH` | `/api/auth/profile` | ✅ `JwtAuthGuard` | Actualiza perfil del usuario autenticado |

> El `userId` en `PATCH /profile` se extrae automáticamente del token (`req.user.sub`), no del body.

---

### `JwtAuthGuard`

Guard reutilizable que protege rutas en **cualquier módulo** que importe `AuthModule`.

**Funcionamiento:**
1. Lee el header `Authorization: Bearer <token>`.
2. Extrae y valida el token con `JwtAdapter.validateToken()`.
3. Si es válido, asigna `request.user = payload` (objeto con `sub`, `email`, `role`).
4. Si falta, está malformado o expiró → lanza `401 UnauthorizedException`.

**Uso en otros módulos:**

```typescript
@Get('mi-ruta-protegida')
@UseGuards(JwtAuthGuard)
async miMetodo(@Req() req: Request) {
  const userId = req.user.sub; // o usar getAuthenticatedUserId(req)
}
```

> `JwtAuthGuard` y `JwtAdapter` están **exportados** por `AuthModule`, por lo que cualquier módulo que importe `AuthModule` los puede usar directamente.

---

### `JwtAdapter`

Envuelve `@nestjs/jwt` para desacoplar el caso de uso del SDK concreto.

```typescript
class JwtAdapter {
  generateToken(payload: object): string   // Firma el JWT
  validateToken(token: string): object     // Verifica y decodifica
}
```

Token configurado con:
- **Secreto:** `JWT_SECRET` (env)
- **Expiración:** `1h`

---

### `BcryptAdapter`

Implementa `IPasswordHasher` usando la librería `bcrypt`.

```typescript
class BcryptAdapter implements IPasswordHasher {
  hash(plain: string): Promise<string>              // saltRounds: 10
  compare(plain: string, hashed: string): Promise<boolean>
}
```

---

### `FirebaseAuthRepository`

Implementa `IAuthRepository` usando **Firebase Admin SDK** con Firestore.

- Colección en Firestore: `users`
- Operaciones: `findByEmail`, `findByNickname`, `findById`, `save`, `update`, `delete`
- Se activa solo si `FIREBASE_PROJECT_ID` y las credenciales Admin están configuradas.
- Si no hay credenciales → el servidor **no arranca** (falla explícitamente, sin fallback a memoria).

---

### `WalletApiClient`

Cliente HTTP interno que llama a `WalletModule` para crear la wallet al registrar.

```typescript
class WalletApiClient {
  createWallet(userId: string): Promise<unknown>
  // POST {WALLET_API_URL}/wallet/create
  // Body: { userId }
}
```

> Si la creación de wallet falla (servicio caído, wallet ya existe), el error se loguea pero **no bloquea** el registro del usuario.

---

## 🌐 API Endpoints

### `POST /api/auth/register`

Registra un nuevo jugador y crea su wallet.

**Body:**
```json
{
  "Name": "Juan",
  "Last_name": "Pérez",
  "Nickname": "juanp",
  "Born_Date": "1990-05-15",
  "Email": "juan@ejemplo.com",
  "Password": "miContraseña123"
}
```

**Respuesta `201`:**
```json
{
  "id": "uuid-generado",
  "email": "juan@ejemplo.com",
  "name": "Juan",
  "nickname": "juanp",
  "wallet": { "chips": 0, "money": 0 }
}
```

---

### `POST /api/auth/login`

Autentica al jugador y retorna el token JWT.

**Body:**
```json
{
  "email": "juan@ejemplo.com",
  "password": "miContraseña123"
}
```

**Respuesta `201`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### `PATCH /api/auth/profile`

Actualiza datos del perfil del usuario autenticado.

**Header requerido:**
```
Authorization: Bearer <access_token>
```

**Body (todos los campos son opcionales):**
```json
{
  "name": "Juan Carlos",
  "nickname": "juanpc",
  "email": "nuevo@email.com",
  "password": "nuevaContraseña456"
}
```

**Respuesta `200`:**
```json
{
  "id": "uuid-del-usuario",
  "email": "nuevo@email.com",
  "name": "Juan Carlos",
  "nickname": "juanpc"
}
```

---

## 🔑 JWT — Payload y uso

El token generado al hacer login contiene:

```json
{
  "sub": "uuid-del-usuario",
  "email": "juan@ejemplo.com",
  "role": "user",
  "iat": 1711234567,
  "exp": 1711238167
}
```

| Campo | Descripción |
|---|---|
| `sub` | ID único del usuario (fuente de `userId` en todos los módulos) |
| `email` | Email del jugador |
| `role` | `'user'` o `'admin'` |
| `iat` | Timestamp de emisión |
| `exp` | Timestamp de expiración (1h después de `iat`) |

> `WalletModule` y `JuegosModule` extraen el `userId` leyendo `req.user.sub` del token validado. Ningún endpoint acepta `userId` desde el exterior.

---

## 🔒 Seguridad de contraseñas

- Las contraseñas se hashean con **bcrypt** (saltRounds: 10) antes de persistirse.
- **Nunca** se almacena ni se retorna el texto plano.
- Al actualizar contraseña, se re-hashea el nuevo valor antes de guardar.
- El hash almacenado es del formato `$2b$10$...` (estándar bcrypt).

---

## 🔥 Persistencia — Firebase Admin

El módulo usa **Firebase Admin SDK** (no el Client SDK) para acceso server-side seguro:

| Aspecto | Detalle |
|---|---|
| SDK | `firebase-admin` |
| Base de datos | Firestore |
| Colección | `users` |
| Credenciales | Cuenta de servicio (JSON o `GOOGLE_APPLICATION_CREDENTIALS`) |
| Modo de inicialización | Condicional: usa `FIREBASE_SERVICE_ACCOUNT_JSON` si existe, si no usa `applicationDefault()` |

> Si no se detectan credenciales válidas al arrancar, el servidor lanza un error y **no permite iniciar**.

---

## 🔗 Integración con Wallet

Al registrar un usuario, `RegisterUseCase` llama automáticamente a `WalletApiClient`:

```
RegisterUseCase
    └── WalletApiClient.createWallet(userId)
            └── POST {WALLET_API_URL}/wallet/create
                    Body: { userId }
```

Esto garantiza que todo jugador registrado tenga una wallet con saldo inicial `0` lista para operar.

---

## ⚙️ Variables de entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `JWT_SECRET` | ✅ | Clave secreta para firmar tokens JWT |
| `FIREBASE_PROJECT_ID` | ✅ | ID del proyecto Firebase |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | ✅ (Opción A) | JSON completo de la cuenta de servicio |
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ (Opción B) | Ruta al archivo `.json` de credenciales |
| `WALLET_API_URL` | ⚠️ Opcional | URL base del servicio Wallet (default: `http://localhost:3000/api`) |

---

## 🔄 Flujos detallados

### Registro

```
Cliente
  │── POST /api/auth/register ──────────────────────────►
  │                                                AuthController
  │                                                    └── RegisterUseCase
  │                                                          ├── findByEmail()     → Firestore
  │                                                          ├── findByNickname()  → Firestore
  │                                                          ├── bcrypt.hash()
  │                                                          ├── save(User)        → Firestore
  │                                                          └── WalletApiClient.createWallet()
  │                                                                └── POST /api/wallet/create
  │◄── { id, email, name, nickname, wallet } ───────────
```

### Login

```
Cliente
  │── POST /api/auth/login ────────────────────────────►
  │                                               AuthController
  │                                                   └── LoginUseCase
  │                                                         ├── findByEmail()   → Firestore
  │                                                         ├── isAccountActive()
  │                                                         ├── bcrypt.compare()
  │                                                         └── jwtAdapter.generateToken()
  │◄── { access_token } ──────────────────────────────
```

### Ruta protegida (cualquier módulo)

```
Cliente
  │── CUALQUIER REQUEST ──────────────────────────────►
  │   Authorization: Bearer <token>                  JwtAuthGuard
  │                                                      ├── Lee header Authorization
  │                                                      ├── jwtAdapter.validateToken()
  │                                                      ├── request.user = payload
  │                                                      └── canActivate() → true
  │                                                   Handler del controlador
  │                                                      └── userId = req.user.sub
  │◄── Respuesta del endpoint ────────────────────────
```

---

## 📋 Resumen de Archivos

| Carpeta            | Tipo de Archivo                | Propósito                                 |
| ------------------ | ------------------------------ | ----------------------------------------- |
| **Domain**         | `.entity.ts`                   | Reglas puras del objeto Usuario.          |
| **Application**    | `.service.ts` / `.use-case.ts` | El flujo de "Cómo me logueo".             |
| **Infrastructure** | `.controller.ts`               | Recibir peticiones `POST`.                |
| **Infrastructure** | `.repository.ts`               | Guardar datos en la DB real.              |
| **Infrastructure** | `.strategy.ts`                 | Configuración técnica de seguridad (JWT). |
