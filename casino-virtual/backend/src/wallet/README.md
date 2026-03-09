# 💰 Módulo de Billetera (Wallet Module)

El **Wallet Module** es el **núcleo financiero del backend**.  
Su responsabilidad es gestionar el saldo de los jugadores, procesar los cobros de las apuestas y el pago de premios con **alta integridad**, asegurando que **ni un solo centavo se pierda** en el proceso.

El sistema utiliza **fichas virtuales** con la equivalencia:

> **10 fichas = $1.00 MXN**

Todo el saldo se almacena **exclusivamente en enteros (integers)** para evitar errores de punto flotante y garantizar **precisión absoluta** en cada operación.

---

## 🏗️ Arquitectura: Hexagonal (Ports & Adapters)

El módulo está organizado siguiendo **Arquitectura Hexagonal**, separando claramente reglas de negocio, casos de uso y detalles técnicos.

---

## 📂 `src/wallet/domain` — *Las Reglas del Dinero*

Capa **más protegida** del sistema.  
Aquí viven las **leyes matemáticas del casino**, sin dependencias externas.

### Componentes

- **`wallet.entity.ts`**
  - Representa el saldo actual del jugador.
  - Contiene reglas invariantes:
    - ❌ No se puede retirar más de lo disponible.
    - ❌ El saldo nunca puede ser negativo.

- **`transaction.entity.ts`**
  - Define cada movimiento del dinero:
    - Depósito
    - Apuesta
    - Premio
  - Sirve como **Ledger** (historial auditable).

- **`chip-value.vo.ts`**
  - *Value Object* responsable de la conversión técnica:
    - Moneda real ↔ Fichas
  - Garantiza consistencia en todas las operaciones.

- **`wallet.repository.interface.ts`**
  - Puerto que define las operaciones de persistencia necesarias.
  - No conoce la base de datos ni la implementación real.

---

## 📂 `src/wallet/application` — *Lógica de Negocio*

Coordina el flujo del dinero entre el usuario y los juegos.  
No implementa reglas técnicas, **orquesta casos de uso**.

### Casos de Uso

- **`process-bet.use-case.ts`**
  - Descuenta el saldo **antes** de que inicie una partida.

- **`credit-winner.use-case.ts`**
  - Acredita las ganancias cuando el jugador gana.

- **`deposit-chips.use-case.ts`**
  - Gestiona la carga de fichas tras una compra exitosa (Stripe).

- **`get-balance.service.ts`**
  - Provee una consulta rápida de:
    - Saldo actual
    - Historial de transacciones

---

## 📂 `src/wallet/infrastructure` — *Persistencia y Entradas*

Implementa los **adaptadores** que conectan el dominio con el mundo exterior.

### Componentes

- **`wallet.controller.ts`**
  - API de entrada para consultar saldo e historial desde el frontend.

- **`wallet.repository.ts`**
  - Implementación real del repositorio usando **TypeORM**.
  - Ejecuta `INSERT` y `UPDATE` transaccionales.

- **`wallet.gateway.ts`**
  - Notificaciones en tiempo real vía **WebSockets**
  - Se dispara cuando el saldo cambia (ej. premio).

- **`entities/wallet.orm-entity.ts`**
  - Definición física de las tablas en la base de datos.

---

## 🎰 Sistema de Fichas

### Equivalencia

| Concepto | Valor |
|--------|-------|
| $1.00 MXN | 10 fichas |
| $10 MXN | 100 fichas |
| Apuesta mínima | 10 fichas (configurable por juego) |

---

### 📦 Paquetes de Compra

| Precio (MXN) | Fichas Recibidas |
|-------------|----------------|
| $10         | 100 
| $60         | 600 
| $150        | 1,500 
| $350        | 3,500 
| $1,000      | 10,000 

---

### 🎨 Denominación Visual de Fichas

| Color  | Valor en Fichas |
|--------|----------------|
| Blanca | 100 
| Roja   | 500 
| Verde  | 2,500 
| Negra  | 10,000 
| Morada | 50,000 
| Dorada | 100,000 

---

## 🛡️ Garantías del Sistema

### ✅ Validación
- Verificación de fondos suficientes antes de cada apuesta.
- Lanza `InsufficientFundsError` si el saldo no alcanza.

### 🔒 Transaccionalidad (ACID)
- Cada cambio de saldo y su transacción asociada ocurren en **una sola transacción de BD**.
- Si algo falla, **el dinero no se mueve**.

### 🧾 Auditoría
- Cada ficha que se mueve genera una transacción.
- Se conserva historial completo:
  - Quién
  - Cuándo
  - Por qué

### 🔁 Idempotencia
- Los pagos de Stripe se procesan **una sola vez**.
- Webhooks duplicados no generan doble saldo.

---

## ⚠️ Nota Crítica

> La lógica de **“cuánto ganó el usuario” NO pertenece a este módulo**.

Esa responsabilidad vive en el **módulo de Juegos**.  
El Wallet **solo ejecuta órdenes claras**:

- ➖ *“Réstale X fichas”*
- ➕ *“Súmale Y fichas”*

Nada más. Nada menos.

---

📌 **Principio clave:**  
**El Wallet no decide resultados, solo protege el dinero.**