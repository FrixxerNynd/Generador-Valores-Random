# ⚙️ Capa de Infraestructura (Infrastructure)

Aquí es donde el software toca el mundo real. Es la capa de los **detalles técnicos** y los **Adaptadores**. Todo lo que dependa de una librería externa o un protocolo de red vive aquí.

### 💡 ¿Qué va aquí?

- **Persistence (Adapters):** Implementaciones reales de las interfaces del dominio (ej. Repositorios de TypeORM o Prisma).
- **Controllers:** Adaptadores de entrada HTTP que reciben las peticiones de Next.js.
- **Gateways:** Adaptadores para WebSockets (tiempo real).
- **External Services:** Clientes para enviar correos, APIs externas, etc.

### 📂 Archivos ejemplo:

- `user.repository.ts` (Implementación de SQL)
- `wallet.controller.ts`
- `socket.gateway.ts`
- `database.config.ts`
