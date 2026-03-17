# Module Context: Juegos — Backend

## Metadata del Proyecto
- **Scope:** `juegos/back/`
- **Puerto:** `3001`
- **Framework:** NestJS 11
- **Arquitectura:** Hexagonal (Ports & Adapters)
- **BD:** Sin BD propia — consume Firestore indirectamente vía Wallet Service
- **Módulos relacionados:** `WalletModule` (puerto 3000), `HistorialModule` (puerto 3002)

## Estado Actual
- **Ruleta:** ✅ Funcional — lógica completa con apuestas múltiples, colores, docenas y externas
- **Blackjack:** ⚠️ Stub — lógica simulada, no jugable
- **Integración Wallet:** ✅ Conectada vía HTTP
- **Integración Historial:** ⚠️ Conectada vía HTTP, pendiente de URL real del equipo
- **Validación de entradas:** ✅ `ValidationPipe` global + DTOs con `class-validator`

---

## Estructura de Carpetas

```
juegos/back/
├── src/
│   ├── cmd/
│   │   ├── main.ts                          # Punto de entrada, puerto 3001
│   │   └── app.module.ts                    # Módulo raíz, registra plugins y adapters
│   ├── internal/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   └── game.model.ts            # Interfaces: Bet, GameResult, GamePlugin
│   │   │   └── ports/
│   │   │       ├── wallet.port.ts           # Contrato con Wallet Service
│   │   │       └── history.port.ts          # Contrato con History Service
│   │   ├── application/
│   │   │   ├── usecases/
│   │   │   │   └── place-bet.use-case.ts    # Orquestador: verifica saldo → juega → acredita → historial
│   │   │   └── dtos/
│   │   │       └── place-bet.dto.ts         # Validación de entrada con class-validator
│   │   └── infrastructure/
│   │       ├── adapters/
│   │       │   ├── game.controller.ts       # POST /games/bet
│   │       │   ├── wallet.controller.ts     # GET /wallet/balance/:userId, POST /wallet/recharge
│   │       │   ├── wallet-api.adapter.ts    # Implementa WalletPort → llama al Wallet Service
│   │       │   └── history.adapter.ts       # Implementa HistoryPort → llama al History Service
│   │       └── plugins/
│   │           ├── roulette/
│   │           │   └── roulette.plugin.ts   # Motor de ruleta (implementa GamePlugin)
│   │           └── blackjack/
│   │               └── blackjack.plugin.ts  # Stub de blackjack (implementa GamePlugin)
│   └── pkg/
│       ├── app.controller.ts                # GET / (health check)
│       └── app.service.ts
├── .env                                     # Variables de entorno (no commitear)
├── .env.example                             # Plantilla de variables
└── package.json
```

---

## Contratos del Dominio

### `Bet` — entrada al use case
```typescript
interface Bet {
  userId: string;
  amount: number;           // total de fichas apostadas
  gameType: string;         // 'roulette' | 'blackjack' | futuros juegos
  selection: any;           // estructura dinámica según el juego
}
```

### `GameResult` — salida del use case
```typescript
interface GameResult {
  winner: boolean;
  payout: number;           // fichas ganadas (0 si perdió)
  winningSelection: any;    // número ganador, cartas, etc.
  message: string;          // mensaje legible para el usuario
}
```

### `GamePlugin` — contrato que todo juego debe implementar
```typescript
interface GamePlugin {
  getName(): string;                        // identificador único del juego
  execute(bet: Bet): Promise<GameResult>;   // lógica del juego
}
```

---

## Endpoints Expuestos

### `POST /games/bet`
Endpoint principal. Recibe la apuesta, ejecuta el juego y devuelve el resultado.

**Body (PlaceBetDto):**
```json
{
  "userId": "user2",
  "amount": 100,
  "gameType": "roulette",
  "selection": [
    { "type": "straight", "value": 17, "amount": 50 },
    { "type": "outside",  "value": "red", "amount": 50 }
  ]
}
```

**Response (GameResult):**
```json
{
  "winner": true,
  "payout": 1800,
  "winningSelection": 17,
  "message": "¡Felicidades! Salió el 17."
}
```

**Tipos de selección para Ruleta:**

| `type`     | `value` de ejemplo         | Multiplicador |
|------------|----------------------------|---------------|
| `straight` | `0` – `36` (número exacto) | 36×           |
| `outside`  | `red`, `black`             | 2×            |
| `outside`  | `even`, `odd`              | 2×            |
| `outside`  | `1-18`, `19-36`            | 2×            |
| `dozen`    | `1st-12`, `2nd-12`, `3rd-12` | 3×          |

> **Nota:** El número `-1` representa el `00` en la ruleta europea.
> El backend usa `randomInt` de `node:crypto` (no `Math.random()`) para mayor aleatoriedad.

### `GET /wallet/balance/:userId`
Proxy hacia el Wallet Service. Devuelve el saldo actual del usuario en fichas.

**Response:**
```json
{ "userId": "user2", "balance": 9500 }
```

### `POST /wallet/recharge`
Proxy de recarga manual para pruebas. Acredita fichas directamente.

**Body:**
```json
{ "userId": "user2", "amount": 1000 }
```

---

## Flujo de una Jugada

```
Cliente (Next.js)
    │
    ▼
POST /games/bet
    │
    ▼
PlaceBetUseCase.execute()
    ├─► WalletPort.getBalance()  →  GET  Wallet Service /wallet/:userId
    ├─► WalletPort.debit()       →  POST Wallet Service /wallet/bet
    ├─► GamePlugin.execute()     →  lógica interna (roulette/blackjack)
    ├─► WalletPort.credit()      →  POST Wallet Service /wallet/credit  (solo si ganó)
    └─► HistoryPort.saveRecord() →  POST History Service /history
    │
    ▼
GameResult → Cliente
```

---

## Variables de Entorno

Crear `juegos/back/.env` (no commitear, usar `.env.example` como plantilla):

```env
PORT=3001
WALLET_SERVICE_URL=http://localhost:3000
HISTORY_SERVICE_URL=http://localhost:3002
```

| Variable              | Descripción                              | Default                     |
|-----------------------|------------------------------------------|-----------------------------|
| `PORT`                | Puerto donde corre este servicio         | `3001`                      |
| `WALLET_SERVICE_URL`  | URL base del Wallet Service (sin `/api`) | `http://localhost:3000`     |
| `HISTORY_SERVICE_URL` | URL base del History Service             | `http://localhost:3002`     |

---

## Cómo Agregar un Nuevo Juego

1. Crear carpeta `src/internal/infrastructure/plugins/[nombre]/`
2. Crear clase que implemente `GamePlugin`:
```typescript
@Injectable()
export class DiceEngine implements GamePlugin {
  getName() { return 'dice'; }

  async execute(bet: Bet): Promise<GameResult> {
    const roll = randomInt(1, 7);
    const isWinner = roll > 3;
    return {
      winner: isWinner,
      payout: isWinner ? bet.amount * 2 : 0,
      winningSelection: roll,
      message: isWinner ? `¡Ganaste! Salió ${roll}` : `Salió ${roll}. Suerte la próxima.`,
    };
  }
}
```
3. Registrar en `app.module.ts`:
```typescript
// En providers:
DiceEngine,

// En el factory de GAME_PLUGINS:
useFactory: (roulette, blackjack, dice) => [roulette, blackjack, dice],
inject: [RoulettePlugin, BlackjackPlugin, DiceEngine],
```

---

## Plan de Integración con Otras Branches

### Con Auth (rama: auth)
**Estado:** ⏳ Pendiente — actualmente `userId` es hardcodeado en el frontend.

**Qué se necesita:**
- El equipo de Auth debe exponer el `userId` en el payload del JWT.
- El Games Backend **no necesita cambios** — ya recibe `userId` como campo del body.
- El Games Frontend debe leer el `userId` del token JWT en vez del store hardcodeado.

**Cambio en el frontend cuando Auth esté listo:**
```typescript
// wallet.store.ts — reemplazar:
userId: 'user2'

// Por algo como:
userId: jwtDecode(localStorage.getItem('token')).sub
```

**Cambio en el backend (opcional, recomendado para producción):**
Agregar `JwtAuthGuard` al `GameController`:
```typescript
@UseGuards(JwtAuthGuard)
@Post('bet')
async placeBet(@Body() dto: PlaceBetDto) { ... }
```
El guard lo provee el equipo de Auth — solo importar y usar.

---

### Con Wallet (rama: wallet)
**Estado:** ✅ Conectado y funcional.

**Endpoints consumidos del Wallet Service:**

| Método | Ruta                 | Cuándo se llama             |
|--------|----------------------|-----------------------------|
| GET    | `/wallet/:userId`    | Para verificar saldo        |
| POST   | `/wallet/bet`        | Para debitar la apuesta     |
| POST   | `/wallet/credit`     | Para acreditar si el jugador ganó |

**Contrato esperado del Wallet:**

`GET /wallet/:userId` debe devolver:
```json
{ "wallet": { "chips": 9500, ... } }
```

`POST /wallet/bet` y `POST /wallet/credit` esperan:
```json
{ "userId": "...", "chipsAmount": 100, "gameDescription": "Apuesta en Roulette" }
```

**Importante para el equipo de Wallet:** El campo se llama `chipsAmount`, no `amount`.
Si el equipo de Wallet cambia su contrato, el único archivo a actualizar es:
`src/internal/infrastructure/adapters/wallet-api.adapter.ts`

---

### Con Historial (rama: historial)
**Estado:** ⚠️ Parcial — el adapter hace el fetch pero la URL puede variar.

**Qué hace este módulo:** Al terminar cada jugada, llama al History Service para registrar el movimiento. Si el History Service no responde, el error se atrapa silenciosamente y **el juego no se bloquea**.

**Endpoint que consume:**

| Método | Ruta       | Body esperado                                                              |
|--------|------------|----------------------------------------------------------------------------|
| POST   | `/history` | `{ userId, game, betAmount, winAmount, detail, timestamp }`                |

**Lo que el equipo de Historial necesita saber:**
- El Games Backend registra automáticamente cada jugada terminada.
- `game` es el nombre del juego en minúsculas (`roulette`, `blackjack`).
- `detail` es un JSON stringificado con el número/resultado ganador.
- Si el jugador perdió, `winAmount` es `0`.

**Pendiente:** Confirmar con el equipo de Historial el puerto y ruta exacta del endpoint, y actualizar `HISTORY_SERVICE_URL` en el `.env`.

---

## Checklist de Estado

### Funcional ahora
- [x] `POST /games/bet` con ruleta completa
- [x] Débito y crédito de fichas vía Wallet Service
- [x] Registro de historial vía History Service
- [x] Validación de body con `class-validator`
- [x] `gameDescription` dinámico según el juego
- [x] Manejo de error si Wallet o History no responden

### Pendiente
- [ ] Integrar `JwtAuthGuard` cuando Auth entregue el guard (5 min)
- [ ] Implementar lógica real de Blackjack (multironda: hit/stand)
- [ ] Confirmar URL del History Service con ese equipo
- [ ] Agregar al `docker-compose.yml` del proyecto cuando se unifique
