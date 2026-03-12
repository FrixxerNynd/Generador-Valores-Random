# Roulette Engine - README Especifico

Este documento describe como probar e integrar el endpoint de ruleta que vive en el modulo `juegos` y se comunica con `Wallet-Fichas`.

## 1) Flujo funcional

1. El frontend envia una apuesta a `POST /juegos/roulette/spin`.
2. El backend de juegos descuenta fichas en Wallet (`POST /wallet/bet`).
3. Se genera un numero aleatorio entre `minRange` y `maxRange`.
4. Si acierta, acredita premio en Wallet (`POST /wallet/credit`).
5. Regresa al front el resultado (`winningNumber`, `isWinner`, etc.) para animaciones.

## 2) Requisitos

- Backend de `casino-virtual` corriendo.
- API de `Wallet-Fichas` corriendo.
- Variable de entorno `WALLET_API_URL` apuntando a Wallet.

Ejemplo:

```env
WALLET_API_URL=http://localhost:3000
PORT=3000
```

## 3) Endpoints de ruleta

### Healthcheck

`GET /juegos/roulette/health`

Respuesta esperada:

```json
{
  "ok": true,
  "service": "roulette-engine"
}
```

### Spin

`POST /juegos/roulette/spin`

Body:

```json
{
  "userId": "user-123",
  "selectedNumber": 7,
  "minRange": 0,
  "maxRange": 36,
  "betAmount": 50,
  "payoutMultiplier": 36,
  "gameDescription": "Apuesta ruleta numero"
}
```

## 4) Ejemplos de prueba (curl)

### 4.1 Verificar servicio

```bash
curl -X GET "http://localhost:3000/juegos/roulette/health"
```

### 4.2 Ejecutar spin

```bash
curl -X POST "http://localhost:3000/juegos/roulette/spin" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"user-123\",\"selectedNumber\":7,\"minRange\":0,\"maxRange\":36,\"betAmount\":50,\"payoutMultiplier\":36}"
```

## 5) Respuesta esperada del spin

```json
{
  "data": {
    "spin": {
      "spinId": "uuid",
      "userId": "user-123",
      "minRange": 0,
      "maxRange": 36,
      "selectedNumber": 7,
      "winningNumber": 19,
      "betAmount": 50,
      "payoutMultiplier": 36,
      "payoutAmount": 0,
      "isWinner": false,
      "createdAt": "2026-03-12T00:00:00.000Z"
    },
    "wallet": {
      "debited": {},
      "credited": null
    }
  }
}
```

Notas:
- Si `isWinner` es `false`, `credited` sera `null` y la apuesta queda descontada.
- Si `isWinner` es `true`, `credited` traera la respuesta de `/wallet/credit`.

## 6) Errores comunes

- `INVALID_RANGE`: `minRange` >= `maxRange` o no enteros.
- `INVALID_SELECTED_NUMBER`: numero fuera de rango.
- `INVALID_BET_AMOUNT`: apuesta <= 0.
- `WALLET_DEBIT_FAILED`: Wallet rechazo descuento.
- `WALLET_CREDIT_FAILED`: fallo al acreditar premio.

## 7) Orden recomendado para levantar servicios

1. Levantar `Wallet-Fichas` primero.
2. Levantar backend `casino-virtual`.
3. Probar `GET /juegos/roulette/health`.
4. Probar `POST /juegos/roulette/spin`.
