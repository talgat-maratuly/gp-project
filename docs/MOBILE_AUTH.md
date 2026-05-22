# GP Service — mobile authentication

Production-ready OTP + refresh session flow for **Expo** (`apps/gp-service-mobile`). Existing email/password API is unchanged.

## Stack

| Layer | Tech |
|-------|------|
| Client storage | `expo-secure-store` (access, refresh, deviceId) |
| Biometrics | `expo-local-authentication` (Face ID / fingerprint) |
| API | `POST /auth/mobile/*` + JWT access (15m) + refresh rotation (30d) |

## Quick test (2 minutes)

1. **API + DB**

```bash
cd /path/to/gp_project
npm install
npm run prisma:migrate:deploy
npm run prisma:generate
npm run dev:api
```

2. **Expo app** (simulator or phone on same Wi‑Fi)

```bash
npm run mobile:urls          # copy LAN IP
export EXPO_PUBLIC_API_URL=http://192.168.x.x:4000   # your IP
npm run dev:mobile
```

3. **Login**

- Enter phone `+77001234567`
- Channel SMS or WhatsApp
- Dev OTP: response field `devCode` or fixed `123456` if `MOBILE_OTP_FIXED=123456` in API env
- Enable biometric checkbox → next cold start shows Face ID gate

## Flow

```mermaid
flowchart TD
  A[App start] --> B{refresh in SecureStore?}
  B -->|no| C[Phone + OTP]
  B -->|yes| D[POST /auth/mobile/refresh]
  D --> E{biometric enabled?}
  E -->|yes| F[LocalAuthentication]
  E -->|no| G[Home]
  F --> G
  C --> H[verify OTP + deviceId]
  H --> G
```

- **First login:** phone → OTP → device bound → tokens saved.
- **Next launches:** silent refresh (one request) → optional biometric → home. No login screens if session valid.
- **Biometric:** client-only gate after refresh; server still validates refresh token + `deviceId`.

## API endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/mobile/otp/send` | — |
| POST | `/auth/mobile/otp/verify` | — |
| POST | `/auth/mobile/refresh` | — |
| POST | `/auth/mobile/logout` | — |
| POST | `/auth/mobile/logout-all` | Bearer |
| GET | `/auth/mobile/sessions` | Bearer |

## Env (API)

```env
MOBILE_OTP_FIXED=123456          # optional dev code
MOBILE_ACCESS_EXPIRES_IN=15m
MOBILE_REFRESH_DAYS=30
OTP_WEBHOOK_URL=                 # optional real SMS/WhatsApp provider
```

## Security notes

- Refresh tokens stored hashed server-side; rotation on each refresh.
- `deviceId` required for refresh (device binding).
- `logout-all` revokes all refresh families for the user.
- Access token in SecureStore; never in AsyncStorage.

## Web GP Service

Web app keeps `POST /auth/login`. Mobile uses parallel `auth/mobile` routes only.
