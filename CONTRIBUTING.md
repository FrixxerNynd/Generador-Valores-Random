# 🛠️ Guía para Desarrolladores — Casino Virtual Backend

> Esta guía está pensada para cualquier persona que descargue el proyecto y quiera entenderlo, ejecutarlo o **extenderlo** (agregar el módulo de historial, completar Blackjack, etc.).

---

## 📑 Tabla de Contenidos

1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación Rápida](#-instalación-rápida)
3. [Variables de Entorno](#-variables-de-entorno)
4. [Entendiendo la Arquitectura](#-entendiendo-la-arquitectura)
5. [Cómo Navegar el Código](#-cómo-navegar-el-código)
6. [Guía: Completar el Plugin de Blackjack](#-guía-completar-el-plugin-de-blackjack)
7. [Guía: Implementar el Módulo de Historial](#-guía-implementar-el-módulo-de-historial)
8. [Flujo de una Apuesta (paso a paso)](#-flujo-de-una-apuesta-paso-a-paso)
9. [Probar la API con cURL / Postman](#-probar-la-api-con-curl--postman)
10. [Errores Comunes](#-errores-comunes)

---

## ✅ Requisitos Previos

| Herramienta | Versión mínima | Para qué se usa |
|---|---|---|
| **Node.js** | 18+ | Ejecutar el servidor |
| **npm** | 9+ | Gestionar dependencias |
| **Cuenta Firebase** | — | Base de datos (Auth + Wallet) |
| **Git** | — | Clonar el repo |

> 💡 Puedes verificar tus versiones con `node -v` y `npm -v`.

---

## 🚀 Instalación Rápida

```bash
# 1. Clonar
git clone <url-del-repo>
cd Casino-Semi-Implementado

# 2. Instalar dependencias
npm install

# 3. Crear archivo de entorno
copy .env.example .env
# (o en Mac/Linux: cp .env.example .env)
# Luego edita .env con tus credenciales (ver sección siguiente)

# 4. Levantar en modo desarrollo (con hot-reload)
npm run start:dev
```

El servidor quedará disponible en **http://localhost:3000/api**.

---

## ⚙️ Variables de Entorno

Crea el archivo `.env` en la **raíz del proyecto** con el siguiente contenido. Sin estas variables el servidor no arrancará correctamente.

```env
# ── Servidor ──────────────────────────────────────────
PORT=3000
FRONTEND_WALLET_URL=http://localhost:3002
FRONTEND_JUEGOS_URL=http://localhost:3001

# ── URLs de comunicación interna entre módulos ────────
WALLET_SERVICE_URL=http://localhost:3000/api
HISTORY_SERVICE_URL=http://localhost:3003   # Solo si implementas el módulo de historial

# ── Firebase (Client SDK — usado por Wallet) ──────────
FIREBASE_API_KEY=tu_api_key
FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
FIREBASE_APP_ID=tu_app_id

# ── Firebase Admin SDK (usado por Auth) ───────────────
# Opción A — pega el JSON completo de tu cuenta de servicio:
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Opción B — ruta al archivo .json descargado de Firebase Console:
GOOGLE_APPLICATION_CREDENTIALS=C:/ruta/a/serviceAccount.json

# ── JWT ───────────────────────────────────────────────
JWT_SECRET=cambia_esto_por_un_secreto_largo_y_seguro
```

### ¿Cómo obtener las credenciales de Firebase?

1. Ve a [Firebase Console](https://console.firebase.google.com/) → tu proyecto → ⚙️ Configuración.
2. **Client SDK**: "Configuración de la app web" → copia los valores de `firebaseConfig`.
3. **Admin SDK**: "Cuentas de servicio" → "Generar nueva clave privada" → descarga el `.json`.

---

## 🏗️ Entendiendo la Arquitectura

El proyecto usa **Arquitectura Hexagonal (Ports & Adapters)**. Si nunca la has visto, aquí está la idea central:

```
┌──────────────────────────────────────────┐
│  INFRASTRUCTURE  (lo que cambia)         │
│  Controllers · Firebase · HTTP clients   │
├──────────────────────────────────────────┤
│  APPLICATION  (orquestación)             │
│  Use Cases · Services                    │
├──────────────────────────────────────────┤
│  DOMAIN  (reglas de negocio puras)       │
│  Entities · Interfaces · Value Objects   │
└──────────────────────────────────────────┘
```

**Regla de oro**: las capas internas (Domain, Application) **nunca importan** capas externas. Solo dependen de interfaces (`ports`). Esto es lo que permite cambiar Firebase por PostgreSQL sin tocar la lógica.

### Los tres módulos y cómo se comunican

```
┌──────────┐  HTTP interno  ┌──────────┐  Puerto (interface)  ┌─────────────────┐
│  Auth    │ ─────────────► │  Wallet  │ ◄──────────────────  │  Juegos (Motor) │
│  Module  │  /wallet/create│  Module  │   WalletPort         │  + Plugins      │
└──────────┘                └──────────┘                       └─────────────────┘
```

- **Auth** crea la billetera del jugador al registrarse (llamada HTTP a `/api/wallet/create`).
- **Juegos** opera sobre la billetera usando el `WalletPort` (interface) → implementado por `WalletApiAdapter` que hace llamadas HTTP a `/api/wallet/*`.
- Los módulos **nunca se importan directamente entre sí** (salvo Auth, que comparte el guard JWT).

---

## 🗂️ Cómo Navegar el Código

Cuando entres al proyecto por primera vez, estos son los archivos clave:

| Archivo | ¿Qué hace? |
|---|---|
| `src/main.ts` | Bootstrap: configura CORS, prefijo `/api`, validación global |
| `src/app.module.ts` | Módulo raíz — importa Auth, Wallet y Juegos |
| `src/auth/auth.module.ts` | Wires del módulo de autenticación |
| `src/wallet/wallet.module.ts` | Wires del módulo de billetera |
| `src/Juegos/cmd/app.module.ts` | Wires del motor de juegos (el que deberás tocar para agregar plugins) |
| `src/Juegos/internal/domain/models/game.model.ts` | Interfaces centrales: `Bet`, `GameResult`, `GamePlugin` |
| `src/Juegos/internal/application/usecases/place-bet.use-case.ts` | Caso de uso central — orquesta toda una apuesta |
| `src/Juegos/internal/infrastructure/adapters/wallet-api.adapter.ts` | Llama al WalletModule vía HTTP |
| `src/Juegos/internal/infrastructure/adapters/history.adapter.ts` | Llama al servicio de historial vía HTTP |

---

## 🃏 Guía: Completar el Plugin de Blackjack

El plugin de Blackjack ya existe en `src/Juegos/internal/infrastructure/plugins/blackjack/blackjack.plugin.ts` pero usa una implementación simulada (números aleatorios). Aquí te explicamos cómo reemplazarla con lógica real.

### ¿Qué recibe y qué debe retornar?

El plugin recibe un objeto `Bet`:

```typescript
// src/Juegos/internal/domain/models/game.model.ts
interface Bet {
  userId: string;
  amount: number;          // Fichas apostadas
  gameType: 'roulette' | 'blackjack';
  selection: any;          // Para blackjack: { action: 'stand' | 'hit' }
}
```

Y debe retornar un `GameResult`:

```typescript
interface GameResult {
  winner: boolean;
  payout: number;          // 0 si perdió, fichas ganadas si ganó
  winningSelection: any;   // Datos del resultado (mano del dealer, del jugador, etc.)
  message: string;         // Mensaje legible para el jugador
}
```

### Implementación completa de Blackjack

Reemplaza el contenido de `src/Juegos/internal/infrastructure/plugins/blackjack/blackjack.plugin.ts` 

### Body de la petición para Blackjack

```json
POST /api/games/bet
Authorization: Bearer <tu_token>

{
  "amount": 200,
  "gameType": "blackjack",
  "selection": {
    "action": "hit"
  }
}
```

Valores válidos de `action`:
- `"stand"` — el jugador no pide más cartas
- `"hit"` — el jugador pide una carta adicional

### Respuesta de ejemplo

```json
{
  "winner": true,
  "payout": 400,
  "winningSelection": {
    "playerHand": ["A♠", "K♥"],
    "dealerHand": ["7♦", "10♣"],
    "playerScore": 21,
    "dealerScore": 17
  },
  "message": "¡BLACKJACK! Paga 3:2. 🎉"
}
```

> ⚠️ **No necesitas tocar ningún otro archivo**. El `PlaceBetUseCase` y el módulo ya están configurados para usar `BlackjackPlugin` automáticamente.

---

## 📜 Guía: Implementar el Módulo de Historial

El módulo de historial **no está implementado** en este proyecto. Actualmente el `HistoryAdapter` hace una llamada HTTP a `HISTORY_SERVICE_URL` (por defecto `http://localhost:3003/api`), y si el servicio no responde simplemente registra un warning en consola y continúa.

Tienes dos formas de implementarlo:

---

### Opción A — Módulo interno en este mismo proyecto (más sencillo)

Agrega el historial dentro del mismo servidor NestJS, similar a como está el módulo Wallet.

#### Paso 1 — Crear la estructura de carpetas

```
src/
└── history/
    ├── history.module.ts
    ├── domain/
    │   ├── entities/
    │   │   └── game-record.entity.ts
    │   └── repositories/
    │       └── history.repository.interface.ts
    ├── application/
    │   └── use-cases/
    │       ├── save-record.use-case.ts
    │       └── get-records.use-case.ts
    └── infrastructure/
        ├── controllers/
        │   └── history.controller.ts
        └── repositories/
            └── firebase-history.repository.ts
```

#### Paso 2 — Entidad de dominio

```typescript
// src/history/domain/entities/game-record.entity.ts
export class GameRecord {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly game: string,
    public readonly betAmount: number,
    public readonly winAmount: number,
    public readonly detail: string,
    public readonly timestamp: Date,
  ) {}

  get isWin(): boolean {
    return this.winAmount > 0;
  }
}
```

#### Paso 3 — Interfaz del repositorio (puerto)

```typescript
// src/history/domain/repositories/history.repository.interface.ts
export interface IHistoryRepository {
  save(record: GameRecord): Promise<void>;
  findByUserId(userId: string): Promise<GameRecord[]>;
}

export const HISTORY_REPOSITORY = Symbol('IHistoryRepository');
```

#### Paso 4 — Caso de uso para guardar

```typescript
// src/history/application/use-cases/save-record.use-case.ts
import { Injectable, Inject } from '@nestjs/common';
import { IHistoryRepository, HISTORY_REPOSITORY } from '../../domain/repositories/history.repository.interface';
import { GameRecord } from '../../domain/entities/game-record.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SaveRecordUseCase {
  constructor(
    @Inject(HISTORY_REPOSITORY)
    private readonly repo: IHistoryRepository,
  ) {}

  async execute(
    userId: string,
    game: string,
    betAmount: number,
    winAmount: number,
    detail: string,
  ): Promise<void> {
    const record = new GameRecord(
      uuidv4(),
      userId,
      game,
      betAmount,
      winAmount,
      detail,
      new Date(),
    );
    await this.repo.save(record);
  }
}
```

#### Paso 5 — Repositorio Firebase (Firestore)

```typescript
// src/history/infrastructure/repositories/firebase-history.repository.ts
import { Injectable } from '@nestjs/common';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { IHistoryRepository } from '../../domain/repositories/history.repository.interface';
import { GameRecord } from '../../domain/entities/game-record.entity';

@Injectable()
export class FirebaseHistoryRepository implements IHistoryRepository {
  private db = getFirestore(/* usa la app Firebase ya inicializada en tu proyecto */);

  async save(record: GameRecord): Promise<void> {
    await addDoc(collection(this.db, 'gameHistory'), {
      id:        record.id,
      userId:    record.userId,
      game:      record.game,
      betAmount: record.betAmount,
      winAmount: record.winAmount,
      detail:    record.detail,
      timestamp: record.timestamp.toISOString(),
    });
  }

  async findByUserId(userId: string): Promise<GameRecord[]> {
    const q = query(collection(this.db, 'gameHistory'), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => {
      const d = doc.data();
      return new GameRecord(d.id, d.userId, d.game, d.betAmount, d.winAmount, d.detail, new Date(d.timestamp));
    });
  }
}
```

#### Paso 6 — Controlador HTTP

```typescript
// src/history/infrastructure/controllers/history.controller.ts
import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { SaveRecordUseCase } from '../../application/use-cases/save-record.use-case';
import { FirebaseHistoryRepository } from '../repositories/firebase-history.repository';
import { JwtAuthGuard } from '../../../auth/infraestructure/guards/jwt-auth.guard';

@Controller('history')
export class HistoryController {
  constructor(
    private readonly saveRecord: SaveRecordUseCase,
    private readonly repo: FirebaseHistoryRepository,
  ) {}

  /** Llamado internamente por el módulo de Juegos */
  @Post()
  async save(@Body() body: {
    userId: string;
    game: string;
    betAmount: number;
    winAmount: number;
    detail: string;
  }) {
    await this.saveRecord.execute(
      body.userId, body.game, body.betAmount, body.winAmount, body.detail,
    );
    return { ok: true };
  }

  /** Consultar historial de un jugador (protegido con JWT) */
  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getByUser(@Param('userId') userId: string) {
    return this.repo.findByUserId(userId);
  }
}
```

#### Paso 7 — Módulo NestJS

```typescript
// src/history/history.module.ts
import { Module } from '@nestjs/common';
import { HISTORY_REPOSITORY } from './domain/repositories/history.repository.interface';
import { FirebaseHistoryRepository } from './infrastructure/repositories/firebase-history.repository';
import { SaveRecordUseCase } from './application/use-cases/save-record.use-case';
import { HistoryController } from './infrastructure/controllers/history.controller';

@Module({
  controllers: [HistoryController],
  providers: [
    SaveRecordUseCase,
    FirebaseHistoryRepository,
    {
      provide: HISTORY_REPOSITORY,
      useClass: FirebaseHistoryRepository,
    },
  ],
})
export class HistoryModule {}
```

#### Paso 8 — Registrar en el módulo raíz

```typescript
// src/app.module.ts  — agrega HistoryModule a los imports
import { HistoryModule } from './history/history.module';

@Module({
  imports: [AuthModule, WalletModule, JuegosModule, HistoryModule],
  // ...
})
export class AppModule {}
```

#### Paso 9 — Actualizar la variable de entorno

```env
# El HistoryAdapter de Juegos llama a esta URL
HISTORY_SERVICE_URL=http://localhost:3000/api
```

> ✅ Con esto el `HistoryAdapter` del módulo de Juegos enviará los registros al endpoint `POST /api/history` que acabas de crear, y todo quedará en Firestore.

---

### Opción B — Microservicio independiente

Si prefieres que el historial sea un servicio separado (en otro puerto o repositorio):

1. Crea un nuevo proyecto NestJS aparte.
2. Implementa el mismo controlador `POST /api/history` y `GET /api/history/:userId`.
3. Apunta `HISTORY_SERVICE_URL` al URL de ese servicio.
4. El `HistoryAdapter` en `src/Juegos/internal/infrastructure/adapters/history.adapter.ts` **ya está listo** para consumirlo, no necesita cambios.

---

## 🔄 Flujo de una Apuesta (paso a paso)

Para entender qué ocurre cuando un jugador apuesta, sigue este camino en el código:

```
1. POST /api/games/bet  (con JWT en header Authorization)
         │
         ▼
2. src/Juegos/internal/infrastructure/adapters/game.controller.ts
   → extrae el accessToken del request
   → llama a PlaceBetUseCase.execute(bet, accessToken)
         │
         ▼
3. src/Juegos/internal/application/usecases/place-bet.use-case.ts
   ├── walletPort.getBalance(token)      → GET  /api/wallet/me
   ├── walletPort.debit(token, amount)   → POST /api/wallet/bet
   ├── plugin.execute(bet)               → lógica del juego
   ├── [si ganó] walletPort.credit()     → POST /api/wallet/credit
   └── historyPort.saveRecord()          → POST /api/history (o log si no existe)
         │
         ▼
4. Retorna GameResult al cliente
```

Los archivos involucrados en cada flecha:
- **WalletPort** → `src/Juegos/internal/domain/ports/wallet.port.ts` (interface)
- **WalletApiAdapter** → `src/Juegos/internal/infrastructure/adapters/wallet-api.adapter.ts` (implementación)
- **HistoryPort** → `src/Juegos/internal/domain/ports/history.port.ts` (interface)
- **HistoryAdapter** → `src/Juegos/internal/infrastructure/adapters/history.adapter.ts` (implementación)

---

## 🧪 Probar la API con cURL / Postman

### 1. Registrar un jugador

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Juan",
    "Last_name": "Pérez",
    "Nickname": "juanp",
    "Born_Date": "1990-05-15",
    "Email": "juan@ejemplo.com",
    "Password": "MiPassword123"
  }'
```

### 2. Login (obtener token)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@ejemplo.com",
    "password": "MiPassword123"
  }'
# Respuesta: { "access_token": "eyJhbGci..." }
```

### 3. Consultar saldo

```bash
curl http://localhost:3000/api/wallet/me \
  -H "Authorization: Bearer <tu_token>"
```

### 4. Apostar en ruleta

```bash
curl -X POST http://localhost:3000/api/games/bet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "amount": 100,
    "gameType": "roulette",
    "selection": [
      { "type": "straight", "value": 17, "amount": 50 },
      { "type": "outside",  "value": "red", "amount": 50 }
    ]
  }'
```

### 5. Apostar en Blackjack

```bash
curl -X POST http://localhost:3000/api/games/bet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "amount": 200,
    "gameType": "blackjack",
    "selection": { "action": "hit" }
  }'
```

---

## 🐛 Errores Comunes

| Error | Causa | Solución |
|---|---|---|
| `Cannot read properties of undefined (reading 'project_id')` | Firebase Admin no configurado | Verifica que `FIREBASE_SERVICE_ACCOUNT_JSON` o `GOOGLE_APPLICATION_CREDENTIALS` estén en `.env` |
| `401 Unauthorized` en cualquier ruta protegida | Token faltante, expirado o `JWT_SECRET` incorrecto | Haz login nuevamente y verifica que `JWT_SECRET` sea el mismo entre reinicios |
| `Error de Wallet API: 404` | El usuario no tiene billetera creada | Registra al usuario correctamente; el registro crea la billetera automáticamente |
| `Juego 'X' no soportado` | `gameType` no existe en los plugins | Solo son válidos `'roulette'` y `'blackjack'`  |
| `Saldo insuficiente` | El jugador apostó más fichas de las que tiene | Deposita fichas primero con `POST /api/wallet/deposit` |
| Puerto 3000 ocupado | Otro proceso usa el puerto | Cambia `PORT` en `.env` o detén el proceso: `npx kill-port 3000` |
| `[HISTORY] Fallo al guardar registro` | El servicio de historial no está corriendo | Es un warning no fatal. Implementa el HistoryModule (ver guía arriba) |

---

## 🔌 Agregar un Nuevo Plugin de Juego (resumen rápido)

1. **Crear** `src/Juegos/internal/infrastructure/plugins/<nombre>/<nombre>.plugin.ts`
   - Implementa la interface `GamePlugin` (método `getName()` y `execute(bet)`)
2. **Registrar** en `src/Juegos/cmd/app.module.ts`:
   - Agrega el plugin a `providers`
   - Agrégalo al array del factory `GAME_PLUGINS`
3. **Actualizar** el tipo en `src/Juegos/internal/domain/models/game.model.ts`:
   - `gameType: 'roulette' | 'blackjack' | '<nombre>'`

El `PlaceBetUseCase` lo detectará automáticamente. No hay que tocar nada más.

---

*¿Encontraste un bug o tienes una duda? Abre un issue o contacta al autor del proyecto.*
