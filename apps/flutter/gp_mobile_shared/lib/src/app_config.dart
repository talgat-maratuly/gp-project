class GpAppConfig {
  const GpAppConfig({
    required this.apiBaseUrl,
    required this.appId,
    required this.loginAs,
    this.enableDevOtp = false,
  });

  final String apiBaseUrl;
  final String appId;
  final String loginAs;
  final bool enableDevOtp;

  String get normalizedApiBaseUrl {
    final trimmed = apiBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    return trimmed.endsWith('/api') ? trimmed : '$trimmed/api';
  }
}

