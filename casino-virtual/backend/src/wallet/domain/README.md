# 🧩 Capa de Dominio (Domain)

Esta es la capa más interna y sagrada del proyecto. Aquí residen las **Reglas de Negocio** puras. No debe depender de ningún framework (ni siquiera de NestJS si es posible) ni de bases de datos.

### 💡 ¿Qué va aquí?

- **Entities:** Clases que representan los objetos del negocio (ej. `User`, `Wallet`, `Bet`). Contienen la lógica que siempre debe cumplirse (ej. "el saldo no puede ser negativo").
- **Repository Interfaces (Ports):** Definimos qué acciones necesitamos hacer con los datos, pero NO cómo se hacen (ej. `IUserRepository`).
- **Value Objects:** Pequeños objetos con lógica propia (ej. `Email`, `Password`).

### 📂 Archivos ejemplo:

- `user.entity.ts`
- `wallet.repository.interface.ts`
- `login.interface.ts`

> **Regla de oro:** Si cambias la base de datos de SQL a MongoDB, NADA en esta carpeta debería cambiar.
