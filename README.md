# Restaurant Auth - gRPC Microservice

Microservicio de autenticación y gestión de usuarios usando **gRPC** y **NestJS**.

## 🚀 Inicio Rápido

### 1. Clonar
```bash
# Clonar el repositorio
git clone <tu-repo>
cd restaurant-auth

### 2. Configurar variables de entorno (.env)

```env
# Puerto del servidor gRPC
GRPC_PORT=50051

# Base de datos PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=restaurant_auth
DB_SYNCHRONIZE=true

# Redis (caché y sesiones)
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=tu_secreto_super_seguro_cambialo_en_produccion

# Email (Mailtrap para desarrollo)
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=tu_usuario_mailtrap
MAIL_PASSWORD=tu_password_mailtrap
MAIL_FROM=noreply@restaurant-auth.com

# URLs (para links en emails)
BASE_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
```

### 3. Levantar servicios

```bash
# Construir e iniciar todos los contenedores
docker compose -f docker-compose.dev.yml up --build

# O en segundo plano
docker compose -f docker-compose.dev.yml up -d

# Ver logs
docker logs restaurant-auth-microservice -f
```

### 4. Detener servicios

```bash
# Detener contenedores
docker compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes (limpia la BD)
docker compose -f docker-compose.dev.yml down -v
```

## 📦 Servicios Disponibles

### 🔐 AuthService (Autenticación - SIN token)

Estos métodos **NO requieren** token de autenticación:

#### **Register** - Registrar nuevo usuario
```bash
grpcurl -plaintext -d '{
  "email": "usuario@ejemplo.com",
  "password": "Password123!",
  "name": "Juan Pérez"
}' localhost:50051 auth.AuthService/Register
```
✉️ Te llegará un email para confirmar tu cuenta.

---

#### **Login** - Iniciar sesión
```bash
grpcurl -plaintext -d '{
  "email": "usuario@ejemplo.com",
  "password": "Password123!"
}' localhost:50051 auth.AuthService/Login
```
📝 Respuesta: `{ "accessToken": "eyJhbGc..." }` - **Guarda este token!**

---

#### **RequestPasswordReset** - Solicitar recuperación de contraseña
```bash
grpcurl -plaintext -d '{
  "email": "usuario@ejemplo.com"
}' localhost:50051 auth.AuthService/RequestPasswordReset
```
✉️ Te llegará un email con un token de reset.

---

#### **ResetPassword** - Restablecer contraseña con token del email
```bash
grpcurl -plaintext -d '{
  "token": "TOKEN_DEL_EMAIL",
  "newPassword": "NuevaPassword123!"
}' localhost:50051 auth.AuthService/ResetPassword
```

---

#### **RequestUnlock** - Solicitar desbloqueo de cuenta (después de 5 intentos fallidos)
```bash
grpcurl -plaintext -d '{
  "email": "usuario@ejemplo.com"
}' localhost:50051 auth.AuthService/RequestUnlock
```
✉️ Te llegará un email con un link de desbloqueo.

---

#### **ConfirmEmail** - Confirmar email después de registro
```bash
grpcurl -plaintext -d '{
  "token": "TOKEN_DEL_EMAIL"
}' localhost:50051 auth.AuthService/ConfirmEmail
```

---

#### **ConfirmEmailUpdate** - Confirmar cambio de email
```bash
grpcurl -plaintext -d '{
  "token": "TOKEN_DEL_EMAIL"
}' localhost:50051 auth.AuthService/ConfirmEmailUpdate
```
⚠️ **Importante**: Después de confirmar, tus tokens anteriores ya NO funcionarán. Debes hacer login nuevamente.

---

#### **RevertEmail** - Revertir cambio de email
```bash
grpcurl -plaintext -d '{
  "token": "TOKEN_DEL_EMAIL"
}' localhost:50051 auth.AuthService/RevertEmail
```
📝 Respuesta: `{ "resetToken": "token_para_reset_password" }` - Úsalo para cambiar contraseña.

---

#### **UnlockAccount** - Desbloquear cuenta con token
```bash
grpcurl -plaintext -d '{
  "token": "TOKEN_DEL_EMAIL"
}' localhost:50051 auth.AuthService/UnlockAccount
```

---

### 👤 UsersService (Gestión de usuarios - CON token)

Estos métodos **SÍ requieren** token JWT en los metadata:

#### **GetMyProfile** - Obtener mi perfil
```bash
grpcurl -plaintext \
  -H "authorization: Bearer TU_TOKEN_JWT" \
  -d '{}' \
  localhost:50051 users.UsersService/GetMyProfile
```

---

#### **UpdateProfile** - Actualizar mi nombre
```bash
grpcurl -plaintext \
  -H "authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "name": "Nuevo Nombre"
  }' \
  localhost:50051 users.UsersService/UpdateProfile
```

---

#### **UpdatePassword** - Cambiar mi contraseña
```bash
grpcurl -plaintext \
  -H "authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "currentPassword": "Password123!",
    "newPassword": "NuevaPassword456!"
  }' \
  localhost:50051 users.UsersService/UpdatePassword
```

---

#### **RequestEmailUpdate** - Solicitar cambio de email
```bash
grpcurl -plaintext \
  -H "authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "password": "Password123!",
    "newEmail": "nuevo@ejemplo.com"
  }' \
  localhost:50051 users.UsersService/RequestEmailUpdate
```
✉️ Te llegará un email al **nuevo email** para confirmar el cambio.

---

#### **DeleteAccount** - Eliminar mi cuenta
```bash
grpcurl -plaintext \
  -H "authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "password": "Password123!"
  }' \
  localhost:50051 users.UsersService/DeleteAccount
```

---

## 🧪 Probar con Insomnia

### 1. Crear request gRPC
- Tipo: **gRPC**
- URL: `localhost:50051`
- Importar proto files desde carpeta `proto/`

### 2. Para métodos SIN autenticación
- Solo llena el **Body** con los datos necesarios

### 3. Para métodos CON autenticación
- **Body**: Datos del método
- **Headers** (pestaña Headers): 
  ```
  authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

## 🔄 Flujo típico de uso

### Registro y confirmación
```bash
1. Register → ✉️ Email con token
2. ConfirmEmail (token del email)
3. Login → 🎫 Obtienes accessToken
```

### Cambiar contraseña olvidada
```bash
1. RequestPasswordReset → ✉️ Email con token
2. ResetPassword (token + nueva contraseña)
3. Login (con nueva contraseña) → 🎫 Nuevo accessToken
```

### Cambiar email
```bash
1. Login → 🎫 accessToken
2. RequestEmailUpdate (con token en headers)
3. ✉️ Email al NUEVO email con token
4. ConfirmEmailUpdate (token del email)
5. ⚠️ Tu token anterior ya NO funciona
6. Login (con NUEVO email) → 🎫 Nuevo accessToken
```

### Cuenta bloqueada
```bash
# Después de 5 intentos fallidos de login
1. RequestUnlock → ✉️ Email con token
2. UnlockAccount (token del email)
3. Login → 🎫 accessToken
```

## 🔐 Seguridad

- ✅ Passwords hasheados con bcrypt
- ✅ JWT con firma HMAC
- ✅ Tokens de un solo uso para confirmaciones
- ✅ Bloqueo de cuenta después de 5 intentos fallidos
- ✅ Validación de email en JWT (tokens inválidos después de cambio de email)
- ✅ Limpieza automática de cuentas no confirmadas (24 horas)

## 🛠️ Desarrollo

```bash
# Ver logs en tiempo real
docker logs restaurant-auth-microservice -f

# Reiniciar solo el microservicio
docker compose -f docker-compose.dev.yml restart microservice

# Acceder a la base de datos
docker exec -it restaurant-auth-postgres psql -U postgres -d restaurant_auth

# Acceder a Redis
docker exec -it restaurant-auth-redis redis-cli
```

## 📁 Estructura

```
restaurant-auth/
├── proto/                    # Definiciones Protocol Buffers
│   ├── auth.proto           # Servicio de autenticación
│   └── users.proto          # Servicio de usuarios
├── src/
│   ├── auth/                # Módulo de autenticación
│   ├── users/               # Módulo de usuarios
│   ├── jwt/                 # Servicio JWT
│   ├── mail/                # Envío de correos
│   ├── redis/               # Caché
│   └── common/              # Utilidades compartidas
├── docker-compose.dev.yml   # Orquestación Docker
└── .env                     # Variables de entorno
```

## 🔗 Integración con API Gateway

Este microservicio está diseñado para ser consumido por un API Gateway que:
- Recibe peticiones HTTP del frontend
- Las convierte a llamadas gRPC al microservicio
- Maneja CORS y autenticación HTTP
- Expone endpoints REST tradicionales

Los links en emails deben apuntar al API Gateway, no al microservicio directamente.
