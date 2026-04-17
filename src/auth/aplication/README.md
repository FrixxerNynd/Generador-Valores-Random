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

---

## 🔐 Casos de Uso de Auth

### LoginUseCase
Autentica un usuario con email y contraseña. Valida las credenciales y retorna un JWT token.

**Método:** `execute(email: string, password: string)`

### RegisterUseCase
Registra un nuevo usuario en el sistema.

**Método:** `execute(name: string, lastName: string, email: string, password: string)`
- Valida que el email no esté registrado
- Hashea la contraseña con bcrypt
- Asigna rol `user` por defecto

### UpdateUserUseCase
Actualiza los datos del perfil de un usuario autenticado.

**Método:** `execute(userId: string, updates: object)`
- Permite actualizar: name, lastName, email, password
- Valida que el nuevo email no esté en uso
- Hashea la nueva contraseña si es proporcionada

