# 🧪 Guía: Cómo Ejecutar los Tests E2E

## ⚡ Quick Start

```bash
# 1. Ir a la carpeta del backend
cd casino-virtual/backend/test

# 2. Ejecutar todos los tests E2E
npm run test:e2e

# 3. O solo los de auth
npm run test:e2e -- auth.e2e-spec.ts
```

## 📊 Qué esperar

Verás algo como esto:

```
Auth Endpoints (e2e)
  POST /auth/register
    ✓ should register a new user successfully (125ms)
    ✓ should fail if email is already registered (98ms)
    ✓ should fail with invalid email format (87ms)
    ✓ should fail with password too short (76ms)
    ✓ should fail with missing required fields (82ms)
    ✓ should fail with name too short (69ms)
  
  POST /auth/login
    ✓ should login successfully with correct credentials (145ms)
    ✓ should fail with invalid email (101ms)
    ✓ should fail with wrong password (89ms)
    ✓ should fail with invalid email format (72ms)
    ✓ should fail with missing credentials (85ms)
  
  PATCH /auth/profile
    ✓ should update profile successfully with valid token (203ms)
    ✓ should update email successfully (189ms)
    ✓ should update password successfully (256ms)
    ✓ should fail without authorization token (98ms)
    ✓ should fail with invalid token (105ms)
    ✓ should fail with malformed authorization header (102ms)
    ✓ should partially update profile with only some fields (167ms)
    ✓ should fail if email is already in use by another user (156ms)

  30 passing (2.5s)
```

---

## 🔍 Qué se está validando

### ✅ Registro
- [x] Crear usuario nuevo con todos los campos
- [x] Impedir registro duplicado por email
- [x] Validar formato de email
- [x] Validar longitud mínima de contraseña (6 caracteres)
- [x] Validar que no falten campos requeridos
- [x] Validar longitud mínima de nombre (2 caracteres)

### ✅ Login
- [x] Login exitoso con credenciales correctas
- [x] Retorna JWT válido
- [x] Rechaza email que no existe
- [x] Rechaza contraseña incorrecta
- [x] Valida formato de email
- [x] Valida que haya email y contraseña

### ✅ Actualización de Perfil
- [x] Requiere token JWT válido
- [x] Rechaza sin token
- [x] Rechaza token inválido
- [x] Rechaza formato incorrecto del token
- [x] Actualiza nombre y apellido
- [x] Actualiza email
- [x] Actualiza contraseña (y hashea correctamente)
- [x] Permite actualización parcial
- [x] Impide emails duplicados
- [x] El nuevo login con nueva contraseña funciona

---

## 🛠️ Troubleshooting

### Error: "Cannot find module '@nestjs/testing'"
```bash
npm install --save-dev @nestjs/testing
```

### Error: "Cannot find module 'supertest'"
```bash
npm install --save-dev supertest @types/supertest
```

### Los tests tardan muchos segundos
- Es normal para tests E2E (levantan la app completa)
- Primera ejecución es más lenta

### Ein test falla con "ECONNREFUSED"
- Verifica que no haya otra instancia corriendo en puerto 3000
- Lune: `npx netstat -ano | findstr :3000` y mata el proceso

---

## 📝 Estructura de los Tests

```
test/
├── auth.e2e-spec.ts          ← Tests de autenticación
├── jest-e2e.json             ← Configuración de Jest
└── jest-e2e.config.js        ← Más configuración (si existe)
```

---

## 🔐 Lo que Valida tu API

Cada test verifica:
1. **Request válido** → Response correcto
2. **Request inválido** → Error 400/401/404
3. **Estado previo** → Usuario existe después del test
4. **Mensajes de error** → Son claros en español
5. **Códigos HTTP** → 201 (Created), 200 (OK), 401 (Unauthorized), 400 (Bad Request)

---

## 💡 Cómo Interpretar Fallos

Si un test falla, verás:

```
FAIL  test/auth.e2e-spec.ts
  Auth Endpoints (e2e)
    POST /auth/register
      ✓ should register a new user successfully
      ✗ should fail if email is already registered

      Expected: 400
      Received: 200

      The test expected a 400 error but got 200 success
```

**Interpretación:** El backend permitió registrar un usuario duplicado cuando debería haber rechazado.

---

## 🚀 Próximos Pasos Después de Pasar los Tests

1. Conectar a BD real (reemplazar `InMemoryAuthRepository`)
2. Agregar OAuth Google
3. Implementar KYC
4. Tests adicionales con usuarios reales

---

## 📱 Formato de Peticiones (Manual)

Si quieres testear dengan Postman/Insomnia:

### Registro
```
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "name": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (201):**
```json
{
  "id": "uuid-v4",
  "email": "john@example.com",
  "name": "John"
}
```

### Login
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Actualizar Perfil
```
PATCH http://localhost:3000/auth/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Jane",
  "email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "id": "uuid-v4",
  "email": "jane@example.com",
  "name": "Jane"
}
```

---

¡Listo! Ahora puedes validar que todo funcione correctamente. 🎉
