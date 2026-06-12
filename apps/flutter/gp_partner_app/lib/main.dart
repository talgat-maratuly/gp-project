import 'package:flutter/material.dart';
import 'package:gp_mobile_shared/gp_mobile_shared.dart';
import 'package:uuid/uuid.dart';

import 'src/screens/partner_home_screen.dart';
import 'src/screens/partner_login_screen.dart';

const _apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://apigp.duckdns.org/api',
);
const _apiFallbackUrl = String.fromEnvironment('API_FALLBACK_URL', defaultValue: '');
const _devOtp = bool.fromEnvironment('GP_DEV_OTP', defaultValue: false);

void main() {
  runApp(const GpPartnerMobileApp());
}

class GpPartnerMobileApp extends StatefulWidget {
  const GpPartnerMobileApp({super.key});

  @override
  State<GpPartnerMobileApp> createState() => _GpPartnerMobileAppState();
}

class _GpPartnerMobileAppState extends State<GpPartnerMobileApp> {
  late final SecureSessionStore _store;
  late final GpApiClient _api;
  late final AuthRepository _auth;
  GpSession? _session;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _store = SecureSessionStore();
    final config = const GpAppConfig(
      apiBaseUrl: _apiUrl,
      apiFallbackUrl: _apiFallbackUrl,
      appId: 'gp-partner-flutter',
      loginAs: 'partner',
      enableDevOtp: _devOtp,
    );
    _api = GpApiClient(config: config, sessionStore: _store);
    _auth = AuthRepository(config: config, api: _api, sessionStore: _store);
    _restore();
  }

  Future<void> _restore() async {
    try {
      final refreshed = await _auth.refresh();
      if (refreshed != null) {
        final ok = await _auth.authenticateWithBiometrics();
        if (ok) _session = refreshed;
      }
    } catch (_) {
      await _store.clear();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String> _deviceId() async {
    final existing = await _store.readDeviceId();
    if (existing != null) return existing;
    final id = const Uuid().v4();
    await _store.saveDeviceId(id);
    return id;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'GP Partner',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff10b981), brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: _loading
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _session == null
              ? PartnerLoginScreen(
                  auth: _auth,
                  deviceIdProvider: _deviceId,
                  devOtpEnabled: _devOtp,
                  onSignedIn: (session) => setState(() => _session = session),
                )
              : PartnerHomeScreen(
                  api: _api,
                  session: _session!,
                  onLogout: () async {
                    await _auth.logout();
                    setState(() => _session = null);
                  },
                ),
    );
  }
}
