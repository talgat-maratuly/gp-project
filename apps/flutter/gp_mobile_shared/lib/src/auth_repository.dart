import 'package:local_auth/local_auth.dart';

import 'api_client.dart';
import 'app_config.dart';
import 'gp_models.dart';
import 'secure_session_store.dart';

class AuthRepository {
  AuthRepository({
    required this.config,
    required this.api,
    required this.sessionStore,
    LocalAuthentication? localAuth,
  }) : _localAuth = localAuth ?? LocalAuthentication();

  final GpAppConfig config;
  final GpApiClient api;
  final SecureSessionStore sessionStore;
  final LocalAuthentication _localAuth;

  Future<GpOtpSendResult> sendOtp(String phone,
      {String channel = 'sms'}) async {
    final json = await api.postJson('/auth/mobile/otp/send', {
      'phone': phone,
      'channel': channel,
    });
    return GpOtpSendResult.fromJson(json);
  }

  Future<GpSession> verifyOtp({
    required String phone,
    required String code,
    required String deviceId,
    String platform = 'flutter',
    GpAccountType accountType = GpAccountType.individual,
    Map<String, dynamic> extra = const {},
  }) async {
    final json = await api.postJson('/auth/mobile/otp/verify', {
      'phone': phone,
      'code': code,
      'deviceId': deviceId,
      'deviceName': config.appId,
      'platform': platform,
      'loginAs': config.loginAs,
      'accountType': accountType == GpAccountType.legalEntity
          ? 'LEGAL_ENTITY'
          : 'INDIVIDUAL',
      'rememberDevice': true,
      'enableBiometric': true,
      ...extra,
    });
    final session = GpSession.fromJson(json);
    await sessionStore.saveDeviceId(deviceId);
    await sessionStore.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    return session;
  }

  Future<GpSession?> refresh() async {
    final refreshToken = await sessionStore.readRefreshToken();
    final deviceId = await sessionStore.readDeviceId();
    if (refreshToken == null || deviceId == null) return null;
    final json = await api.postJson('/auth/mobile/refresh', {
      'refreshToken': refreshToken,
      'deviceId': deviceId,
    });
    final session = GpSession.fromJson(json);
    await sessionStore.saveTokens(
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    );
    return session;
  }

  Future<bool> authenticateWithBiometrics() async {
    final canCheckBiometrics = await _localAuth.canCheckBiometrics;
    final isDeviceSupported = await _localAuth.isDeviceSupported();
    final available = canCheckBiometrics || isDeviceSupported;
    if (!available) return false;
    return _localAuth.authenticate(
      localizedReason: 'Войти в GP',
      options: const AuthenticationOptions(
        biometricOnly: false,
        stickyAuth: true,
      ),
    );
  }

  Future<void> logout() async {
    final refreshToken = await sessionStore.readRefreshToken();
    if (refreshToken != null && refreshToken.isNotEmpty) {
      try {
        await api
            .postJson('/auth/mobile/logout', {'refreshToken': refreshToken});
      } catch (_) {
        // Local logout should still work when the phone is offline.
      }
    }
    await sessionStore.clear();
  }
}
