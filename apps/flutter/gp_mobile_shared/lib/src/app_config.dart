class GpAppConfig {
  const GpAppConfig({
    required this.apiBaseUrl,
    required this.appId,
    required this.loginAs,
    this.apiFallbackUrl = '',
    this.enableDevOtp = false,
  });

  final String apiBaseUrl;
  final String apiFallbackUrl;
  final String appId;
  final String loginAs;
  final bool enableDevOtp;

  String get normalizedApiBaseUrl => normalizeApiBaseUrl(apiBaseUrl);

  String get normalizedFallbackApiBaseUrl => normalizeApiBaseUrl(apiFallbackUrl);

  bool get hasFallbackApiBaseUrl => normalizedFallbackApiBaseUrl.isNotEmpty;

  static String normalizeApiBaseUrl(String value) {
    final trimmed = value.trim().replaceAll(RegExp(r'/+$'), '');
    if (trimmed.isEmpty) return '';
    return trimmed.endsWith('/api') ? trimmed : '$trimmed/api';
  }
}
