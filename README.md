# 🎰 Casino Virtual — Backend

> **API Backend completo para un casino virtual** construido con **NestJS**, **TypeScript**, **Firebase Firestore** y **WebSockets**. Implementa **Arquitectura Hexagonal (Ports & Adapters)** en todos sus módulos para garantizar un sistema desacoplado, mantenible y extensible.

---

## 📑 Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Cambios Recientes](#-cambios-recientes-marzo-2026)
4. [Arquitectura del Sistema](#-arquitectura-del-sistema)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Módulos](#-módulos)
   - [Auth Module](#-módulo-de-autenticación-auth)
   - [Wallet Module](#-módulo-de-billetera-wallet)
   - [Juegos Module](#-módulo-de-juegos-juegos)
7. [API Endpoints](#-api-endpoints)
8. [Sistema de Fichas](#-sistema-de-fichas)
9. [Variables de Entorno](#-variables-de-entorno)
10. [Instalación y Ejecución](#-instalación-y-ejecución)
11. [Flujo de una Partida](#-flujo-de-una-partida)
12. [Extensibilidad: Agregar un Nuevo Juego](#-extensibilidad-agregar-un-nuevo-juego)

---

## 🎯 Descripción General

Casino Virtual es una plataforma de juegos en línea cuyo backend gestiona tres grandes responsabilidades:

| Responsabilidad | Módulo | Descripción |
|---|---|---|
| 🔐 **Identidad** | `AuthModule` | Registro, login y protección de rutas con JWT. |
| 💰 **Finanzas** | `WalletModule` | Saldo en fichas virtuales, apuestas, premios y recargas. |
| 🎲 **Juegos** | `JuegosModule` | Motor de juegos con plugins (Ruleta, Blackjack). |

Todos los módulos se comunican entre sí a través de **interfaces (puertos)** y **llamadas HTTP internas**, respetando el principio de separación de responsabilidades.

## 🆕 Cambios recientes (Marzo 2026)

- `Wallet` y `Juegos` ahora resuelven `wlId/userId` desde el **token JWT** (`Authorization: Bearer <token>`).
- Se eliminaron rutas con `:userId` para operaciones del usuario autenticado en `Wallet`.
- `Juegos` ahora reenvía el token al adaptador HTTP (`WalletApiAdapter`) para operar sobre `/api/wallet/me` y endpoints protegidos.
- Se agregó utilidad compartida `src/shared/utils/auth-user.util.ts` para extraer `userId` y token de forma consistente.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| **NestJS** | 11.x | Framework principal |
| **TypeScript** | 5.7.x | Lenguaje base |
| **Firebase / Firestore** | 11.x / 13.x | Base de datos (Auth + Wallet) |
| **Firebase Admin SDK** | 13.x | Operaciones server-side en Auth |
| **JWT (`@nestjs/jwt`)** | 11.x | Autenticación stateless |
| **bcrypt** | 6.x | Hash seguro de contraseñas |
| **Socket.io / WebSockets** | 4.7.x | Notificaciones en tiempo real (saldo) |
| **class-validator** | 0.15.x | Validación de DTOs |
| **dotenv** | 17.x | Gestión de variables de entorno |

---

## 🏗️ Arquitectura del Sistema

El proyecto sigue **Arquitectura Hexagonal (Ports & Adapters)**, que separa el código en tres capas independientes:

```
┌─────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE (Adapters)             │
│   Controllers · Repositories · Gateways · Guards       │
├─────────────────────────────────────────────────────────┤
│                   APPLICATION (Use Cases)               │
│   register · login · processBet · creditWinner · ...   │
├─────────────────────────────────────────────────────────┤
│                   DOMAIN (Business Rules)               │
│   Entities · Value Objects · Repository Interfaces     │
└─────────────────────────────────────────────────────────┘
```

### Principios clave aplicados

- **Inversión de Dependencias**: Los casos de uso solo dependen de interfaces (`IAuthRepository`, `WalletPort`, etc.), nunca de implementaciones concretas.
- **Comunicación entre módulos vía HTTP**: Los módulos `Juegos` y `Auth` se comunican con `Wallet` a través de llamadas HTTP internas, como si fuera un microservicio, evitando acoplamiento directo.
- **Plugin System para Juegos**: Cada juego es un `GamePlugin` inyectable, lo que permite agregar juegos nuevos sin tocar el núcleo de la lógica.

```
┌──────────┐  HTTP   ┌──────────┐  Ports  ┌──────────────────┐
│  Auth    │ ──────► │  Wallet  │ ◄────── │  Juegos (Engine) │
│  Module  │         │  Module  │         │  + Plugins       │
└──────────┘         └──────────┘         └──────────────────┘
     │                    │
     └── Firebase Admin   └── Firebase Client SDK
         (Firestore)          (Firestore)
```

---

## 📁 Estructura del Proyecto

```
Casino-Semi-Implementado/
├── .env                        # Variables de entorno
├── nest-cli.json
├── package.json
├── tsconfig.json
└── src/
    ├── main.ts                 # Bootstrap: CORS, pipes globales, prefijo /api
    ├── app.module.ts           # Módulo raíz (importa Auth, Wallet, Juegos)
    ├── app.controller.ts       # Healthcheck GET /
    ├── app.service.ts
    │
    ├── auth/                   # 🔐 Módulo de Autenticación
    │   ├── auth.module.ts
    │   ├── domain/
    │   │   ├── user.entity.ts
    │   │   ├── auth.repository.interface.ts
    │   │   └── password-hasher.interface.ts
    │   ├── aplication/
    │   │   ├── login.use-case.ts
    │   │   ├── register.use-case.ts
    │   │   └── update-user.use-case.ts
    │   └── infraestructure/
    │       ├── auth.controller.ts
    │       ├── adapters/
    │       │   ├── bcrypt.adapter.ts
    │       │   ├── jwt.adapter.ts
    │       │   └── wallet-api.client.ts    # Cliente HTTP hacia WalletModule
    │       ├── guards/
    │       │   └── jwt-auth.guard.ts
    │       ├── dtos/
    │       │   ├── login.dto.ts
    │       │   ├── register.dto.ts
    │       │   └── update-user.dto.ts
    │       ├── ports/
    │       └── repositories/
    │           └── firebase-auth.repository.ts
    │
    ├── wallet/                 # 💰 Módulo de Billetera
    │   ├── wallet.module.ts
    │   ├── domain/
    │   │   ├── entities/
    │   │   │   ├── wallet.entity.ts
    │   │   │   └── transaction.entity.ts
    │   │   ├── value-objects/
    │   │   │   └── chip-value.vo.ts
    │   │   ├── errors/
    │   │   │   └── insufficient-funds.error.ts
    │   │   └── repositories/
    │   │       └── wallet.repository.interface.ts
    │   ├── application/
    │   │   ├── services/
    │   │   │   └── get-balance.service.ts
    │   │   ├── use-cases/
    │   │   │   ├── create-wallet.use-case.ts
    │   │   │   ├── deposit-chips.use-case.ts
    │   │   │   ├── process-bet.use-case.ts
    │   │   │   ├── credit-winner.use-case.ts
    │   │   │   ├── withdraw-chips.use-case.ts
    │   │   │   └── get-history.use-case.ts
    │   │   └── dtos/
    │   └── infrastructure/
    │       ├── controllers/
    │       │   └── wallet.controller.ts
    │       ├── gateways/
    │       │   └── wallet.gateway.ts       # WebSocket: notifica cambios de saldo
    │       ├── listeners/
    │       │   └── stripe-webhook.listener.ts
    │       ├── persistence/
    │       └── repositories/
    │           └── wallet.repository.ts    # Firebase Firestore
    │
    └── Juegos/                 # 🎲 Motor de Juegos
        ├── cmd/
        │   └── app.module.ts               # JuegosModule (AppModule1)
        ├── pkg/
        │   ├── app.controller.ts
        │   └── app.service.ts
        └── internal/
            ├── domain/
            │   ├── models/
            │   │   └── game.model.ts       # Interfaces: Bet, GameResult, GamePlugin
            │   └── ports/
            │       ├── wallet.port.ts      # Puerto hacia WalletModule
            │       └── history.port.ts     # Puerto hacia historial
            ├── application/
            │   ├── usecases/
            │   │   └── place-bet.use-case.ts
            │   └── dtos/
            └── infrastructure/
                ├── adapters/
                │   ├── game.controller.ts
                │   ├── wallet.controller.ts
                │   ├── wallet-api.adapter.ts   # Implementación del WalletPort via HTTP
                │   └── history.adapter.ts
                └── plugins/
                    ├── roulette/
                    │   └── roulette.plugin.ts
                    └── blackjack/
                        └── blackjack.plugin.ts
```

---

## 📦 Módulos

---

### 🔐 Módulo de Autenticación (Auth)

Responsable de la **identidad y seguridad** de los jugadores. Implementa autenticación **stateless con JWT**.

#### Entidad de Dominio: `User`

```typescript
class User {
  id: string;           // UUID
  name: string;
  last_name: string;
  nickname: string;
  born_date: Date;
  email: string;        // Único
  password: string;     // Hash bcrypt
  role: string;         // 'user' | 'admin'
  status: boolean;      // Cuenta activa/suspendida

  isAccountActive(): boolean;
  get fullName(): string;
}
```

#### Casos de Uso

| Caso de Uso | Descripción |
|---|---|
| `LoginUseCase` | Valida credenciales, compara hash y emite un JWT (1h de validez). |
| `RegisterUseCase` | Crea el usuario con hash de contraseña y llama al `WalletApiClient` para crear la billetera inicial. |
| `UpdateUserUseCase` | Permite actualizar datos del perfil (protegido con JWT). |

#### Repositorio de Datos: Firebase Firestore (Admin SDK)

- Usa **Firebase Admin SDK** para operaciones server-side seguras.
- El `FirebaseAuthRepository` se registra condicionalmente: solo activa si `FIREBASE_PROJECT_ID` y las credenciales están disponibles en el entorno.
- Diseñado para ser fácilmente intercambiado por una implementación PostgreSQL o MongoDB sin tocar los casos de uso.

#### Flujo de Autenticación

```
POST /api/auth/register
    │
    ├── RegisterUseCase
    │   ├── Hash contraseña (bcrypt)
    │   ├── Guarda User en Firestore
    │   └── Llama WalletApiClient → POST /api/wallet/create (crea billetera)
    │
    └── Retorna { id, email, name, nickname, wallet }

POST /api/auth/login
    │
    ├── LoginUseCase
    │   ├── Busca usuario por email en Firestore
    │   ├── Compara hash (bcrypt.compare)
    │   └── Firma JWT con userId como 'sub'
    │
    └── Retorna { access_token }
```

#### Guard de Protección: `JwtAuthGuard`

Cualquier ruta decorada con `@UseGuards(JwtAuthGuard)` verifica el token `Bearer` en el header `Authorization`. Si el token es inválido o expirado, retorna `401 Unauthorized`.

---

### 💰 Módulo de Billetera (Wallet)

El **núcleo financiero** del casino. Gestiona el saldo de fichas virtuales con **alta integridad y auditoría completa**.

#### Sistema de Fichas Virtuales

> **10 fichas = $1.00 MXN**

Todo el saldo se almacena en **enteros** para evitar errores de punto flotante.

#### Entidades de Dominio

**`Wallet`**
```
- userId: string (referencia al jugador)
- chips: number  (saldo en fichas, siempre ≥ 0)
- Invariante: el saldo jamás puede ser negativo
```

**`Transaction`** (Ledger auditable)
```
- tipo: 'deposit' | 'bet' | 'prize' | 'withdraw'
- chipsAmount: number
- gameDescription: string
- timestamp: Date
```

**`ChipValue` (Value Object)**
- Gestiona la conversión entre moneda real ↔ fichas.
- Garantiza consistencia en toda la plataforma.

#### Casos de Uso

| Caso de Uso | Descripción |
|---|---|
| `CreateWalletUseCase` | Crea la billetera inicial de un nuevo jugador (llamado desde Auth al registrar). |
| `GetBalanceService` | Consulta saldo actual e historial de transacciones. |
| `DepositChipsUseCase` | Acredita fichas tras una compra exitosa (integración con Stripe webhook). |
| `ProcessBetUseCase` | Descuenta el saldo **antes** de iniciar una partida. Lanza `InsufficientFundsError` si no hay fondos. |
| `CreditWinnerUseCase` | Acredita las ganancias cuando el jugador gana. |
| `WithdrawChipsUseCase` | Retira fichas (conversión a dinero real). |
| `GetHistoryUseCase` | Devuelve el historial completo de transacciones. |

#### Garantías del Sistema

- ✅ **Validación previa**: Verifica fondos antes de cada apuesta.
- 🔒 **ACID**: Cambio de saldo y registro de transacción ocurren atómicamente.
- 🧾 **Auditoría completa**: Cada movimiento genera un registro con quién, cuándo y por qué.
- 🔁 **Idempotencia en Stripe**: Los webhooks duplicados no generan doble saldo.
- 📡 **Tiempo real**: `WalletGateway` (WebSocket) notifica al frontend cada vez que cambia el saldo.

#### Paquetes de Recarga

| Precio (MXN) | Fichas Recibidas |
|---|---|
| $10 | 100 |
| $60 | 600 |
| $150 | 1,500 |
| $350 | 3,500 |
| $1,000 | 10,000 |

#### Denominación Visual de Fichas

| Color | Valor en Fichas |
|---|---|
| ⚪ Blanca | 100 |
| 🔴 Roja | 500 |
| 🟢 Verde | 2,500 |
| ⚫ Negra | 10,000 |
| 🟣 Morada | 50,000 |
| 🟡 Dorada | 100,000 |

---

### 🎲 Módulo de Juegos (Juegos)

El **motor de juego** del casino. Implementa un sistema de plugins extensible donde cada juego es independiente y auto-contenido.

#### Modelo de Dominio

```typescript
interface Bet {
  userId: string;
  amount: number;                       // En fichas
  gameType: 'roulette' | 'blackjack';
  selection: any;                       // Apuesta específica del juego
}

interface GameResult {
  winner: boolean;
  payout: number;                       // Fichas ganadas (0 si perdió)
  winningSelection: any;               // Resultado del juego
  message: string;                      // Mensaje al jugador
}

interface GamePlugin {
  getName(): string;
  execute(bet: Bet): Promise<GameResult>;
}
```

#### Caso de Uso Central: `PlaceBetUseCase`

Es el único caso de uso del motor y orquesta el **ciclo completo de una apuesta**:

```
PlaceBetUseCase.execute(bet)
    │
    ├── 1. Localiza el plugin por gameType
  ├── 2. Consulta saldo via WalletPort.getBalance(accessToken)
    ├── 3. Valida que haya fondos suficientes
  ├── 4. Debita la apuesta: WalletPort.debit(accessToken)
    ├── 5. Ejecuta la lógica del juego: plugin.execute(bet)
  ├── 6. Si ganó → acredita premio: WalletPort.credit(accessToken)
    └── 7. Registra en historial: HistoryPort.saveRecord()
```

#### Plugins de Juegos Implementados

##### 🎡 Ruleta (`RoulettePlugin`)

- Genera un número ganador entre 0-37 usando `crypto.randomInt` (criptográficamente seguro).
- El número 37 se trata como `00` (doble cero americano).
- Soporta múltiples tipos de apuesta por ronda:

| Tipo de Apuesta | `type` | Multiplicador |
|---|---|---|
| Número exacto | `straight` | 36x |
| Docena (1-12, 13-24, 25-36) | `dozen` | 3x |
| Par/Impar, Rojo/Negro, 1-18/19-36 | `outside` | 2x |

##### 🃏 Blackjack (`BlackjackPlugin`)

- Plugin base implementado.
- Contiene la estructura `GamePlugin` lista para desarrollar la lógica completa.

#### Comunicación con Wallet (Puerto)

El módulo de Juegos **nunca importa WalletModule directamente**. En su lugar define un puerto:

```typescript
interface WalletPort {
  getBalance(accessToken: string): Promise<number>;
  debit(accessToken: string, amount: number, description: string): Promise<boolean>;
  credit(accessToken: string, amount: number, description: string): Promise<boolean>;
}
```

La implementación `WalletApiAdapter` realiza llamadas HTTP a `WALLET_SERVICE_URL` (por defecto `http://localhost:3000/api`), permitiendo que en el futuro Wallet sea un microservicio independiente sin cambiar el código del motor de juegos.

---

## 🌐 API Endpoints

El servidor expone todos los endpoints bajo el prefijo global `/api`.

### Auth

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ Pública | Registra un nuevo jugador |
| `POST` | `/api/auth/login` | ❌ Pública | Login, retorna JWT |
| `PATCH` | `/api/auth/profile` | ✅ JWT Bearer | Actualiza datos del perfil |

**Body `POST /api/auth/register`:**
```json
{
  "Name": "Juan",
  "Last_name": "Pérez",
  "Nickname": "juanp",
  "Born_Date": "1990-05-15",
  "Email": "juan@ejemplo.com",
  "Password": "miContraseñaSegura"
}
```

**Body `POST /api/auth/login`:**
```json
{
  "email": "juan@ejemplo.com",
  "password": "miContraseñaSegura"
}
```

---

### Wallet

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `POST` | `/api/wallet/create` | ❌ Pública (interna) | Crea wallet inicial para registro |
| `GET` | `/api/wallet/me` | ✅ JWT Bearer | Consulta saldo e historial del usuario autenticado |
| `GET` | `/api/wallet/me/history` | ✅ JWT Bearer | Historial con filtros (`action`, `currencyType`, `from`, `to`) |
| `GET` | `/api/wallet/info/packages` | ❌ Pública | Consulta paquetes de fichas |
| `POST` | `/api/wallet/deposit` | ✅ JWT Bearer | Recarga de fichas |
| `POST` | `/api/wallet/bet` | ✅ JWT Bearer | Procesa una apuesta (débito) |
| `POST` | `/api/wallet/credit` | ✅ JWT Bearer | Acredita premio al usuario |
| `POST` | `/api/wallet/withdraw` | ✅ JWT Bearer | Retiro de fichas |

**Body `POST /api/wallet/bet`:**
```json
{
  "chipsAmount": 100,
  "gameDescription": "Apuesta en Roulette"
}
```

> ℹ️ `userId` **ya no se envía** en body/params para operaciones autenticadas; se obtiene del token.

---

### Juegos

| Método | Ruta | Autenticación | Descripción |
|---|---|---|---|
| `POST` | `/api/games/bet` | ✅ JWT Bearer | Realiza una apuesta en un juego |
| `GET` | `/api/wallet/balance` | ✅ JWT Bearer | Consulta saldo desde el módulo de juegos |
| `POST` | `/api/wallet/recharge` | ✅ JWT Bearer | Recarga manual desde el módulo de juegos |

**Body `POST /api/games/bet`:**
```json
{
  "amount": 100,
  "gameType": "roulette",
  "selection": [
    { "type": "straight", "value": 17, "amount": 50 },
    { "type": "outside", "value": "red", "amount": 50 }
  ]
}
```

> ℹ️ `userId` en `Bet` se usa internamente en dominio, pero para API HTTP se deriva del JWT.

**Respuesta de ejemplo:**
```json
{
  "winner": true,
  "payout": 1800,
  "winningSelection": 17,
  "message": "¡Felicidades! Salió el 17."
}
```

---

## 🎰 Sistema de Fichas

```
$1.00 MXN = 10 fichas

Apuesta mínima: 10 fichas (configurable por juego)
```

Todo el sistema usa enteros para total precisión. La conversión moneda ↔ fichas es responsabilidad exclusiva del **Value Object `ChipValue`** en el dominio de Wallet.

---

## ⚙️ Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# ── Servidor ──────────────────────────────────────────
PORT=3000
FRONTEND_WALLET_URL=http://localhost:3002
FRONTEND_JUEGOS_URL=http://localhost:3001

# ── Comunicación Interna ──────────────────────────────
WALLET_SERVICE_URL=http://localhost:3000/api
HISTORY_SERVICE_URL=http://localhost:3003

# ── Firebase (Client SDK — Wallet) ────────────────────
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id

# ── Firebase Admin SDK (Auth) ─────────────────────────
# Opción A: JSON completo de la cuenta de servicio
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Opción B: Ruta al archivo de credenciales
GOOGLE_APPLICATION_CREDENTIALS=/ruta/a/service-account.json

# ── JWT ───────────────────────────────────────────────
JWT_SECRET=tu_secreto_muy_seguro
```

> ⚠️ **Importante**: El módulo Auth **requiere obligatoriamente** credenciales Firebase Admin. Sin ellas el servidor lanzará un error al iniciar.

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js 18+ 
- npm 9+
- Cuenta de Firebase con Firestore habilitado

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd Casino-Semi-Implementado

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Firebase

# 4. Levantar el servidor en modo desarrollo
npm run start:dev
```

El servidor estará disponible en: `http://localhost:3000/api`

### Scripts Disponibles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Servidor con hot-reload |
| `npm run start` | Servidor estático |
| `npm run start:prod` | Servidor desde `dist/` (producción) |
| `npm run build` | Compilar TypeScript |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:cov` | Tests con cobertura |
| `npm run lint` | Linter con auto-fix |
| `npm run format` | Formatear código con Prettier |

---

## 🔄 Flujo de una Partida Completa

```
JUGADOR                    BACKEND
   │                          │
   │── POST /auth/login ──────►│ AuthController
   │◄── { access_token } ─────│   └── LoginUseCase → Firestore → JWT
   │                          │
   │── POST /games/bet ───────►│ GameController (JWT Guard)
   │  { gameType: "roulette", │   └── PlaceBetUseCase
  │    amount: 100,          │         ├── WalletApiAdapter.getBalance(token)
  │    selection: [...] }    │         │     └── GET /api/wallet/me
   │                          │         ├── WalletApiAdapter.debit()
   │                          │         │     └── POST /api/wallet/bet
   │                          │         ├── RoulettePlugin.execute(bet)
   │                          │         │     └── crypto.randomInt(0,38)
   │                          │         ├── [Si ganó] WalletApiAdapter.credit()
   │                          │         │     └── POST /api/wallet/credit
   │                          │         └── HistoryAdapter.saveRecord()
   │◄── { winner, payout,    │
   │      message } ──────────│
   │                          │
   │              [WebSocket] │
   │◄── saldo actualizado ────│ WalletGateway (Socket.io)
```

---

## 🔌 Extensibilidad: Agregar un Nuevo Juego

Gracias al sistema de plugins, añadir un nuevo juego solo requiere **3 pasos**:

### 1. Crear el Plugin

```typescript
// src/Juegos/internal/infrastructure/plugins/slots/slots.plugin.ts
import { Injectable } from '@nestjs/common';
import { Bet, GamePlugin, GameResult } from '../../../domain/models/game.model';

@Injectable()
export class SlotsPlugin implements GamePlugin {
  getName(): string {
    return 'slots';
  }

  async execute(bet: Bet): Promise<GameResult> {
    // Tu lógica de tragamonedas aquí
    const symbols = ['🍒', '🍋', '⭐', '7️⃣'];
    const reels = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    const winner = reels.every(s => s === reels[0]);
    return {
      winner,
      payout: winner ? bet.amount * 10 : 0,
      winningSelection: reels,
      message: winner ? '¡JACKPOT! 🎉' : 'Sigue intentando...',
    };
  }
}
```

### 2. Registrar en el Módulo

```typescript
// src/Juegos/cmd/app.module.ts
import { SlotsPlugin } from '../internal/infrastructure/plugins/slots/slots.plugin';

@Module({
  providers: [
    // ... otros providers
    SlotsPlugin,
    {
      provide: 'GAME_PLUGINS',
      useFactory: (roulette, blackjack, slots) => [roulette, blackjack, slots],
      inject: [RoulettePlugin, BlackjackPlugin, SlotsPlugin],
    },
  ],
})
export class AppModule1 {}
```

### 3. Actualizar el Tipo en el Dominio

```typescript
// src/Juegos/internal/domain/models/game.model.ts
export interface Bet {
  gameType: 'roulette' | 'blackjack' | 'slots'; // ← Agregar aquí
  // ...
}
```

**¡Listo!** El `PlaceBetUseCase` automáticamente detectará el nuevo plugin y lo ejecutará correctamente.

---

## 🗂️ Cambiar la Base de Datos

La arquitectura hexagonal permite reemplazar Firebase por PostgreSQL, MongoDB u otro motor sin tocar la lógica de negocio:

1. Crear una nueva implementación de `IAuthRepository` o `IWalletRepository`.
2. Reemplazar el provider en el módulo correspondiente (`auth.module.ts` / `wallet.module.ts`).
3. El resto del código no cambia.

Ver [`DATABASE-SETUP.md`](src/auth/DATABASE-SETUP.md) para instrucciones detalladas.

---

## 📄 Licencia

UNLICENSED — Proyecto académico / privado.
