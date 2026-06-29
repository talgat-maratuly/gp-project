# GP Flutter Release

This is the mobile release path for GP.

## App Roles

- GP Service web: server/web deployment from `apps/gp-service`.
- GP Partner web: server/web deployment from `apps/gp-partner`.
- GP Admin: web only, server deployment from `apps/gp-admin`.
- GP Service mobile: Flutter app from `apps/flutter/gp_service_app`.
- GP Partner mobile: Flutter app from `apps/flutter/gp_partner_app`.
- Backend API: server deployment from `apps/api`.

Do not publish the Expo prototype from `apps/gp-service-mobile` to App Store or Play Market.

## Production API

Both Flutter apps must use:

```text
https://apigp.duckdns.org/api
```

The Dart config normalizes URLs so `https://apigp.duckdns.org` also becomes `/api`, but release builds should pass the full API URL explicitly.

## Store Identifiers

Use stable package identifiers:

```text
GP Service iOS bundle id: kz.gp.service
GP Service Android application id: kz.gp.service
GP Partner iOS bundle id: kz.gp.partner
GP Partner Android application id: kz.gp.partner
```

If native folders are generated with `flutter create`, verify these IDs in:

- `ios/Runner.xcodeproj/project.pbxproj`
- `android/app/build.gradle` or `android/app/build.gradle.kts`

## Android Signing

The GitHub APK workflow produces test artifacts signed with the debug key so
they can be downloaded and installed quickly. Play Market releases must use a
real upload key or app signing configuration before publishing.

## Commands

Flutter SDK is installed locally under:

```text
tools/flutter
```

Root npm scripts use this local SDK, so a global `flutter` command is not required.

Install dependencies:

```bash
npm run flutter:pub-get
```

Analyze both Flutter apps:

```bash
npm run flutter:analyze
```

Build GP Service for Play Market:

```bash
npm run flutter:service:build:android
```

Build GP Partner for Play Market:

```bash
npm run flutter:partner:build:android
```

Build GP Service for App Store:

```bash
npm run flutter:service:build:ios
```

Build GP Partner for App Store:

```bash
npm run flutter:partner:build:ios
```

Generate/check unsigned iOS app bundles without Apple signing:

```bash
npm run flutter:build:ios:unsigned
```

## iPhone Testing

iPhone cannot install Android APK files.

The GitHub workflow `Build Flutter iOS` verifies that both Flutter apps compile for iOS without code signing. Its artifacts are unsigned `.app` bundles and are only build artifacts; they cannot be installed on tester iPhones.

Downloadable GitHub artifacts:

```text
gp-service-ios-unsigned-app
gp-partner-ios-unsigned-app
```

For real iPhone testing, use TestFlight. Required Apple credentials:

- Apple Developer Program membership.
- App Store Connect apps for `kz.gp.service` and `kz.gp.partner`.
- Signing certificate and provisioning profiles.
- App Store Connect API key for upload automation.

After those credentials are available as GitHub secrets, the workflow can be extended to produce signed `.ipa` files and upload them to TestFlight.

## Required Before Store Submission

- Flutter SDK installed on the build machine.
- Native `ios/` and `android/` folders generated/configured for each Flutter app.
- Apple Developer account and App Store Connect records for both apps.
- Google Play Console records for both apps.
- Production backend is deployed and healthy.
- `CORS_ORIGINS` includes web origins; mobile apps use HTTPS API directly.
- Push notifications require FCM/APNs integration before enabling notification claims in store metadata.
- Privacy forms must mention phone number, device id/session tokens, and optional biometric unlock.
