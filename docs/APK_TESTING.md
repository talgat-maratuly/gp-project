# GP Flutter APK testing

GP Service and GP Partner can be tested on Android phones with debug APK files.

## Build APK

Default production API:

```bash
npm run flutter:build:apk
```

Custom API or tunnel:

```bash
GP_API_URL=https://apigp.duckdns.org/api npm run flutter:build:apk
```

Fallback API for phones that cannot resolve DuckDNS:

```bash
GP_API_URL=https://apigp.duckdns.org/api \
GP_API_FALLBACK_URL=https://your-fallback-domain/api \
npm run flutter:build:apk
```

## APK files

After a successful build:

```text
apps/flutter/gp_service_app/build/app/outputs/flutter-apk/app-debug.apk
apps/flutter/gp_partner_app/build/app/outputs/flutter-apk/app-debug.apk
```

## Android SDK

If Flutter says `No Android SDK found`, install Android SDK from Android Studio:

1. Open Android Studio.
2. Go to Settings -> Languages & Frameworks -> Android SDK.
3. Install Android SDK Platform, Android SDK Build-Tools, Android SDK Platform-Tools.
4. Make sure `ANDROID_HOME` points to `~/Library/Android/sdk`.

Then run:

```bash
tools/flutter/bin/flutter doctor -v
npm run flutter:build:apk
```
