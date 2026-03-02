# 🔐 Módulo de Autenticación (Auth Module)

El módulo de **Auth** es el componente crítico encargado de la identidad. Su función principal es asegurar que solo los usuarios legítimos accedan al casino, gestionando desde el registro inicial hasta la emisión de tokens seguros para las apuestas.

---

## 🏗️ Responsabilidades por Capa

Para mantener el sistema seguro y fácil de actualizar, el código se divide en tres niveles de aislamiento:

### 1. 📂 `src/auth/domain` (El Corazón de la Identidad)

Aquí se definen las reglas de negocio de un usuario que son independientes de cualquier tecnología.

- **Qué hace:** Define qué datos componen a un usuario y qué reglas deben cumplir (ej: "un email debe ser único" o "la contraseña no se guarda en texto plano").
- **Archivos típicos:**
- `user.entity.ts`: Clase que representa al usuario del casino.
- `auth.repository.interface.ts`: El **Puerto**. Una interfaz que dice: "Necesito guardar y buscar usuarios", sin importar si la base de datos es SQL, NoSQL o un archivo.

### 2. 📂 `src/auth/application` (La Lógica de Proceso)

Es el mediador que dicta los pasos a seguir para completar una acción de seguridad.

- **Qué hace:** Orquesta el flujo de los datos. No sabe de rutas HTTP, solo de procesos lógicos.
- **Archivos típicos:**
- `login.use-case.ts`: Recibe credenciales, pide al dominio validar el usuario y solicita a la infraestructura generar un token.
- `register.use-case.ts`: Toma los datos de un nuevo jugador, aplica el hash a la contraseña y ordena su guardado.

### 3. 📂 `src/auth/infrastructure` (Los Detalles Técnicos)

Es la capa más externa. Aquí es donde NestJS brilla conectándose con librerías y protocolos.

- **Qué hace:** Contiene los **Adaptadores**. Aquí es donde el "mundo real" (HTTP, JWT, Bases de Datos) toca nuestro sistema.
- **Archivos típicos:**
- `auth.controller.ts`: El punto de entrada que Next.js llama vía API.
- `jwt.strategy.ts`: La implementación técnica de cómo se firma y se lee un token JWT.
- `user.repository.ts`: El código que realmente hace el `INSERT` o `SELECT` en la base de datos (usando TypeORM o Prisma).
- `auth.guard.ts`: El escudo que protege las rutas de los juegos y la billetera.

---

## 🛡️ ¿En qué consiste este módulo?

Este módulo implementa una **Autenticación Stateless (Sin estado)** basada en **JWT (JSON Web Tokens)**.

1. **Identificación:** El usuario entrega sus credenciales.
2. **Verificación:** Comparamos el hash de la contraseña (usando `bcrypt`).
3. **Autorización:** Si es correcto, entregamos un "pase VIP" (el token).
4. **Persistencia:** Este token permite que el usuario juegue en los motores de juego o consulte su saldo en la billetera sin tener que loguearse de nuevo en cada clic.

---

## 📋 Resumen de Archivos

| Carpeta            | Tipo de Archivo                | Propósito                                 |
| ------------------ | ------------------------------ | ----------------------------------------- |
| **Domain**         | `.entity.ts`                   | Reglas puras del objeto Usuario.          |
| **Application**    | `.service.ts` / `.use-case.ts` | El flujo de "Cómo me logueo".             |
| **Infrastructure** | `.controller.ts`               | Recibir peticiones `POST`.                |
| **Infrastructure** | `.repository.ts`               | Guardar datos en la DB real.              |
| **Infrastructure** | `.strategy.ts`                 | Configuración técnica de seguridad (JWT). |
