# 🎰 Módulo de Motores de Juego (Game Engines)

Este módulo es el responsable de la lógica aleatoria y el cálculo de resultados del casino. Está diseñado bajo el principio de **Abierto/Cerrado (SOLID)**: podemos añadir infinitos juegos nuevos sin modificar el núcleo de la billetera o el sistema de usuarios.

---

## 🏗️ Arquitectura del Módulo

El módulo se divide en tres capas internas para mantener el desacoplamiento:

#### 1. 📂 `/domain` (El Contrato)

Aquí reside la **Interface Common** que rige a todos los juegos.

- **Archivo clave:** `igame-logic.interface.ts`
- **Responsabilidad:** Define el contrato que DEBE cumplir cualquier juego.
  - `execute(betAmount: number): GameOutcome` // Procesa la jugada y retorna el resultado.

### 2. 📂 `/plugins` (Los Adaptadores de Juego)

Cada subcarpeta aquí es un "motor" independiente. No comparten lógica entre sí, solo implementan la interfaz del dominio.

- **`/slots`**: Lógica de rodillos y símbolos.
- **`/roulette`**: Lógica de posiciones 0-36 y colores.
- **`/crash`**: Lógica de multiplicador creciente con probabilidad de "bust".

### 3. 📂 `/application` (El Orquestador)

Contiene los servicios de NestJS que actúan como mediadores.

- **`game-executor.service.ts`**: Recibe una petición de apuesta, identifica qué juego quiere el usuario, llama al plugin correspondiente y devuelve el resultado al Core de la Billetera.

---

## 🛠️ Cómo agregar un nuevo juego (Guía para Desarrolladores)

Para añadir un juego (ejemplo: "Dados"), sigue estos 3 pasos:

1. **Crear el Plugin:** Crea la carpeta `plugins/dice` y una clase `DiceEngine` que implemente `IGameLogic`.
2. **Programar la Probabilidad:** Define dentro de esa clase cómo se genera el número aleatorio (usando `Math.random()` o un sistema de _Provably Fair_).
3. **Registrar en el Módulo:** Añade el nuevo motor al array de `providers` en `juegos.module.ts`.

---

Ejemplo Práctico: Motor de Dados (Dice Engine)
Para entender cómo funciona, mira este ejemplo de un juego donde "Sacar más de 3 gana".

    1. El Contrato (domain/igame-logic.interface.ts)

```typescript
export interface IGameLogic {
  readonly name: string;
  execute(betAmount: number): any;
}
```

    2. El Plugin (plugins/dice/dice.engine.ts)

```typescript
import { Injectable } from '@nestjs/common';
import { IGameLogic } from '../../domain/igame-logic.interface';

@Injectable()
export class DiceEngine implements IGameLogic {
readonly name = 'DICE_GAME';

execute(betAmount: number) {
// 1. Generar azar (1 al 6)
const roll = Math.floor(Math.random() \* 6) + 1;

// 2. Aplicar regla: Mayor a 3 duplica apuesta
const isWinner = roll > 3;
const payout = isWinner ? betAmount * 2 : 0;

return { game: this.name, roll, isWinner, payout };

}
}
```

---

## 📡 Comunicación en Tiempo Real (Infrastructure/Gateway)

Dentro de la infraestructura de este módulo vive el **Socket Gateway**:

- **`juegos.gateway.ts`**: Es el encargado de emitir los eventos hacia **Next.js**.
- Cuando un plugin genera un resultado, este gateway hace un `emit('game_result', data)` para que el cliente vea la animación de victoria inmediatamente.

---

## 📋 Tipos de Archivos en esta Carpeta

| Archivo               | Ubicación          | Tipo           | Descripción                                                         |
| :-------------------- | :----------------- | :------------- | :------------------------------------------------------------------ |
| `igame-result.dto.ts` | `/application/dto` | **DTO**        | Estructura de datos que regresa el juego (ganancia, símbolos, etc). |
| `slots.engine.ts`     | `/plugins/slots`   | **Service**    | La implementación matemática del tragamonedas.                      |
| `game.controller.ts`  | `/infrastructure`  | **Controller** | Punto de entrada HTTP para lanzar una jugada.                       |
| `juegos.module.ts`    | `root`             | **Module**     | Configuración de NestJS para este módulo.                           |

## El ciclo de vida de una jugada:

- El cliente (Next.js) dispara una acción.
- El game-executor invoca el execute() del plugin seleccionado.
- El resultado se envía al WalletModule para impactar el saldo.
- El juegos.gateway notifica al cliente el éxito o fracaso.
