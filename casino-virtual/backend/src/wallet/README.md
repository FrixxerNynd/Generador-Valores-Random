# 💰 Módulo de Billetera (Wallet Module)

El módulo de **Wallet** es el núcleo financiero del backend. Su responsabilidad es gestionar el saldo de los jugadores, procesar los cobros de las apuestas y el pago de premios. Es un sistema de **Alta Integridad**, diseñado para que ni un solo centavo se pierda en el proceso.

---

## 🏗️ Responsabilidades por Capa

Siguiendo la **Arquitectura Hexagonal**, el flujo del dinero se separa para proteger la lógica de los fallos técnicos:

### 1. 📂 `src/wallet/domain` (Las Reglas del Dinero)

Es la capa más protegida. Aquí se definen las leyes matemáticas de tu casino.

- **Qué hace:** Define qué es un saldo y qué operaciones son válidas (ej: "No se puede retirar más de lo que hay" o "El monto de apuesta debe ser mayor a cero").
- **Archivos típicos:**
- `wallet.entity.ts`: Clase que contiene el saldo actual y las reglas para modificarlo.
- `transaction.entity.ts`: Define un movimiento (Depósito, Apuesta, Premio).
- `wallet.repository.interface.ts`: El **Puerto**. Define qué operaciones de guardado necesitamos (ej: `updateBalance`, `saveTransaction`).

### 2. 📂 `src/wallet/application` (La Lógica de Negocio)

Es el director que coordina el dinero entre el usuario y los juegos.

- **Qué hace:** Ejecuta los procesos financieros. No sabe si el dinero viene de una ruleta o de un tragamonedas, solo sabe cuánto sumar o restar.
- **Archivos típicos:**
- `process-bet.use-case.ts`: Caso de uso que descuenta el dinero antes de que el juego empiece.
- `credit-winner.use-case.ts`: Caso de uso que suma las ganancias cuando el jugador gana.
- `get-balance.service.ts`: Consulta rápida del estado de cuenta.

### 3. 📂 `src/wallet/infrastructure` (La Persistencia y Entrada)

Es la capa que toca la base de datos real y recibe peticiones.

- **Qué hace:** Implementa los **Adaptadores**. Aquí es donde el saldo se guarda físicamente en tablas de SQL y donde el frontend consulta datos.
- **Archivos típicos:**
- `wallet.controller.ts`: El punto de entrada para que Next.js muestre el saldo en pantalla.
- `wallet.repository.ts`: El código que hace el `UPDATE` en la tabla de saldos y el `INSERT` en el historial de transacciones (Ledger).
- `wallet.gateway.ts`: Notifica en tiempo real al usuario mediante Sockets cuando su saldo cambia tras un premio.

[Image showing Wallet entity interacting with a database through a repository interface]

---

## 🛡️ ¿En qué consiste este módulo?

Este módulo funciona como un **Libro Mayor (Ledger)**.

1. **Validación:** Antes de jugar, verificamos que el usuario tenga saldo suficiente.
2. **Transaccionalidad:** Usamos transacciones de base de datos (ACID). Si un juego falla, el dinero "vuelve" a la cuenta para que el usuario no pierda por un error del sistema.
3. **Auditoría:** Cada moneda que se mueve genera una transacción en la base de datos para que siempre haya un historial de "quién, cuándo y por qué" cambió el saldo.

---

## 📋 Resumen de Archivos

| Carpeta            | Tipo de Archivo  | Propósito                                                   |
| ------------------ | ---------------- | ----------------------------------------------------------- |
| **Domain**         | `.entity.ts`     | Reglas de validación de saldo (Negocio).                    |
| **Application**    | `.use-case.ts`   | El proceso de cobrar o pagar un premio.                     |
| **Infrastructure** | `.controller.ts` | API para que el usuario vea su saldo.                       |
| **Infrastructure** | `.repository.ts` | Guardado real en SQL Server/Postgres.                       |
| **Infrastructure** | `.gateway.ts`    | Actualizar el saldo en la pantalla del usuario (Real-time). |

---

> **Nota Crítica:** La lógica de "Cuánto ganó el usuario" NO va aquí, esa va en el módulo de **Juegos**. El módulo de **Wallet** solo recibe la orden: _"Réstale 10"_ o _"Súmale 50"_.
