# 📑 Módulo de Juegos: Interfaces

Este directorio define los **contratos de comportamiento** y las estructuras de datos fundamentales para todo el módulo. Aquí reside la "lengua franca" que permite la comunicación entre el núcleo del juego, los sistemas de renderizado y los plugins.

## 🎯 Propósito

El uso de interfaces en este módulo busca:

1. **Desacoplamiento:** Permitir que diferentes sistemas (IA, Física, UI) interactúen entre sí sin conocer sus implementaciones internas.
2. **Seguridad de Tipos:** Garantizar que cualquier objeto que se pase a través de los sistemas cumpla con las propiedades requeridas.
3. **Facilidad de Testing:** Permitir la creación de _Mocks_ para pruebas unitarias de forma sencilla.

---

## 📂 Organización de las Interfaces

Las interfaces se categorizan según su dominio de aplicación:

### 🎮 1. Actor & Entities (`/entities`)

Define qué es un objeto dentro del mundo del juego.

- `IEntity`: Propiedades básicas (ID, Transform, Tag).
- `IDamageable`: Contratos para objetos que pueden perder salud.
- `IControllable`: Métodos para objetos que aceptan inputs de jugador o IA.

### ⚙️ 2. Core Systems (`/systems`)

Contratos para los motores internos.

- `ISystem`: Ciclo de vida básico (`init`, `update`, `shutdown`).
- `IEventBus`: Estructura para la comunicación basada en eventos.
- `IStorageAdapter`: Interfaz para sistemas de guardado (Local, Cloud, DB).

### 🔌 3. Plugin API (`/plugins`)

Define cómo los plugins externos deben "hablar" con el juego.

- `IPluginManifest`: Estructura de los metadatos del plugin.
- `IPluginHook`: Puntos de entrada para inyectar lógica personalizada.

---

## 🛠️ Ejemplo de Implementación

Para asegurar la consistencia, cualquier nueva mecánica que implique interacción debería extender una interfaz de este directorio.

**Ejemplo: Implementando un sistema de salud**
Si un plugin añade un "Escudo de Energía", no necesita conocer el código del "Jugador", solo necesita implementar `IDamageable`:

```typescript
// Localizado en /interfaces/entities/IDamageable.ts
export interface IDamageable {
  health: number;
  maxHealth: number;
  takeDamage(amount: number): void;
  onDeath(): void;
}
```

---

## ⚖️ Reglas de Contribución

Para mantener este directorio limpio y escalable, sigue estas normas:

- **Inmutabilidad:** Las interfaces de datos deben tender a ser de solo lectura siempre que sea posible.
- **Granularidad (ISP):** Es mejor tener muchas interfaces pequeñas y específicas (ej. `ICanJump`, `ICanFly`) que una interfaz gigante (`ICharacter`).
- **Documentación JSDoc:** Todas las interfaces y sus métodos deben incluir un breve comentario explicando su propósito y valores de retorno.
