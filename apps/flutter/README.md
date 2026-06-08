# GP Flutter Mobile

Flutter-ready workspace for GP mobile apps.

This is the App Store and Play Market path for GP mobile apps.
GP Admin remains web-only.

## Apps

- `gp_service_app` — client app for GP Service.
- `gp_partner_app` — partner app for specialists, shops, nursery, and delivery partners.
- `gp_mobile_shared` — shared Dart package for API, OTP auth, refresh tokens, secure storage, and biometric login.

See `RELEASE.md` before building store releases.

## API

Default production API:

```text
https://apigp.duckdns.org/api
```

Local Android emulator:

```bash
--dart-define=API_URL=http://10.0.2.2:4000/api
```

Real phone in LAN:

```bash
--dart-define=API_URL=http://YOUR_LAN_IP:4000/api
```

## DEV OTP

For local/dev testing only:

```bash
--dart-define=GP_DEV_OTP=true
```

Then use code:

```text
0000
```

Production backend rejects `0000` when `NODE_ENV=production`.

## Run

```bash
cd apps/flutter/gp_service_app
flutter pub get
flutter run --dart-define=API_URL=https://apigp.duckdns.org/api
```

```bash
cd apps/flutter/gp_partner_app
flutter pub get
flutter run --dart-define=API_URL=https://apigp.duckdns.org/api
```

## MVP Included

- Phone + WhatsApp/SMS OTP login.
- DEV OTP code support.
- Refresh token restore.
- Device ID storage.
- Face ID / Touch ID via `local_auth`.
- GP Service home with service list.
- GP Partner home with order list.

## Next Mobile Screens

- Service order creation.
- Market catalog/cart/checkout.
- Hunter irrigation calculator.
- Plant Doctor photo upload.
- Partner accept/start/complete order flow.
- Partner GPS after accepted order.
