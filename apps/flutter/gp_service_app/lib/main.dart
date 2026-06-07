import 'package:flutter/material.dart';
import 'package:gp_mobile_shared/gp_mobile_shared.dart';
import 'package:uuid/uuid.dart';

import 'src/screens/home_screen.dart';
import 'src/screens/otp_login_screen.dart';

const _apiUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'https://apigp.duckdns.org/api',
);
const _devOtp = bool.fromEnvironment('GP_DEV_OTP', defaultValue: false);

void main() {
  runApp(const GpServiceMobileApp());
}

class GpServiceMobileApp extends StatefulWidget {
  const GpServiceMobileApp({super.key});

  @override
  State<GpServiceMobileApp> createState() => _GpServiceMobileAppState();
}

class _GpServiceMobileAppState extends State<GpServiceMobileApp> {
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
      appId: 'gp-service-flutter',
      loginAs: 'client',
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
      title: 'GP Service',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff059669)),
        useMaterial3: true,
      ),
      home: _loading
          ? const _LoadingScreen()
          : _session == null
              ? OtpLoginScreen(
                  auth: _auth,
                  deviceIdProvider: _deviceId,
                  devOtpEnabled: _devOtp,
                  onSignedIn: (session) => setState(() => _session = session),
                )
              : HomeScreen(
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

class _LoadingScreen extends StatelessWidget {
  const _LoadingScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}

