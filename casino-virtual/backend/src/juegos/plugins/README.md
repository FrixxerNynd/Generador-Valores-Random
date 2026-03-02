# 🧩 Módulo de Juegos: Carpeta de Plugins

Este directorio contiene la lógica de **extensibilidad** del módulo de juegos. La arquitectura de plugins permite añadir funcionalidades, mecánicas y herramientas de terceros sin modificar el código base del motor (Core).

## 💡 Filosofía de Diseño

La carpeta `plugins` sigue el principio de **Open/Closed** (Abierto para extensión, cerrado para modificación). El objetivo es que cada pieza de funcionalidad nueva sea un paquete independiente que se "conecta" al flujo principal del juego.

## 🏗️ Estructura de la Carpeta

Cada subdirectorio dentro de `plugins/` debe considerarse un módulo autónomo:

- **`/internal`**: Plugins esenciales desarrollados por el equipo core (ej. Sistemas de logros, guardado básico).
- **`/third-party`**: Extensiones externas o librerías adaptadas (ej. Integración con Steam SDK, Discord RPC).
- **`/tools`**: Scripts y utilidades que solo funcionan en tiempo de desarrollo (ej. Editores de niveles, depuradores de memoria).

---

## ⚙️ ¿Cómo funciona la Lógica de Carga?

El sistema de juego utiliza un **Plugin Manager** que realiza los siguientes pasos al iniciar:

1. **Discovery (Descubrimiento):** Escanea el directorio en busca de archivos de configuración (ej. `plugin.json` o `manifest.yaml`).
2. **Dependency Check:** Verifica que los plugins requeridos por otros estén presentes y cargados en el orden correcto.
3. **Registration:** Registra el plugin en el bus de eventos o en el contenedor de inyección de dependencias.
4. **Lifecycle Hooks:** Ejecuta los métodos del ciclo de vida del plugin:

- `onLoad()`: Inicialización de variables.
- `onEnable()`: Activación de la lógica dentro del loop del juego.
- `onDisable()`: Limpieza de memoria y guardado de estado.

---

## 🚀 Cómo crear un nuevo Plugin

Para mantener la consistencia, todos los plugins deben implementar la interfaz base:

```typescript
// Ejemplo conceptual de la interfaz de plugin
interface IGamePlugin {
  id: string;
  version: string;
  init(gameContext: GameContext): void;
  update(deltaTime: number): void;
}
```

### Pasos rápidos:

1. Crea una carpeta con el nombre de tu funcionalidad.
2. Define un archivo de entrada (ej. `index.ts` o `main.py`).
3. Registra tu plugin en el archivo de configuración global si el sistema no utiliza _auto-discovery_.

---

## ⚠️ Reglas de Oro

- **Aislamiento:** Un plugin no debe depender de los archivos internos de otro plugin a menos que sea una dependencia declarada.
- **Performance:** Evita pesados cálculos en el `update()` del plugin para no afectar los FPS del juego base.
- **Limpieza:** Siempre libera los recursos (texturas, listeners) en el método de desactivación.

---
