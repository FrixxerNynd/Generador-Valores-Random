# Roulette Integration

## Endpoint

- `GET /juegos/roulette/health`
- `POST /juegos/roulette/spin`

## Body de spin

```json
{
  "userId": "user-1",
  "selectedNumber": 7,
  "minRange": 0,
  "maxRange": 36,
  "betAmount": 50,
  "payoutMultiplier": 36,
  "gameDescription": "Apuesta Ruleta"
}
```

## Integración Wallet

- Debita fichas: `POST /wallet/bet`
- Acredita premio: `POST /wallet/credit`

Variable de entorno:

```env
WALLET_API_URL=http://localhost:3000
```
