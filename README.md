# Roulette Backend

Backend de ruleta en Nest.js con arquitectura hexagonal y conexión con `Wallet-Fichas`.

## Requisitos

- Node.js 18+
- Wallet API corriendo (proyecto `Wallet-Fichas`)

## Configuración

1. Copiar variables de entorno:

```bash
cp .env.example .env
```

2. Ajustar `WALLET_API_URL` al host/puerto de Wallet.

```env
PORT=3010
WALLET_API_URL=http://localhost:3000
```

## Ejecutar

```bash
npm install
npm run start:dev
```

## Endpoint principal

### POST `/roulette/spin`

Body:

```json
{
  "userId": "user-1",
  "selectedNumber": 7,
  "minRange": 0,
  "maxRange": 36,
  "betAmount": 50,
  "payoutMultiplier": 36,
  "gameDescription": "Apuesta ruleta número"
}
```

Comportamiento:

1. Descuenta fichas con `POST /wallet/bet` en Wallet.
2. Genera número aleatorio en el rango.
3. Si gana, acredita premio con `POST /wallet/credit`.
4. Retorna resultado del spin para que el front haga animaciones.

## Healthcheck

- `GET /roulette/health`
