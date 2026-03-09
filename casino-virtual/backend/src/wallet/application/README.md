# 🎮 Capa de Aplicación (Application)

Esta capa actúa como un puente. Su trabajo es **orquestar** el flujo de datos. No sabe cómo se guarda un dato, ni sabe quién hizo la petición HTTP; solo sabe qué pasos seguir para completar una acción.

### 💡 ¿Qué va aquí?

- **Use Cases (Servicios de Aplicación):** Clases que ejecutan una tarea específica del usuario (ej. `PlaceBetUseCase`, `WithdrawFundsService`).
- **Commands/Queries:** Estructuras de datos para pedir acciones.

### 📂 Archivos ejemplo:

- `process-bet.service.ts`
- `register-user.use-case.ts`

### 🔄 Flujo típico:

1. El Use Case recibe datos procesados.
2. Llama al Dominio para validar reglas.
3. Llama a la Infraestructura (vía interfaces) para persistir los cambios.
