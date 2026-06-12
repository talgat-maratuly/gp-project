import 'package:dio/dio.dart';

import 'app_config.dart';
import 'secure_session_store.dart';

class GpApiClient {
  GpApiClient({
    required GpAppConfig config,
    required SecureSessionStore sessionStore,
    Dio? dio,
  })  : _config = config,
        _sessionStore = sessionStore,
        dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: config.normalizedApiBaseUrl,
                connectTimeout: const Duration(seconds: 20),
                receiveTimeout: const Duration(seconds: 30),
                headers: {'Accept': 'application/json'},
              ),
            ) {
    this.dio.interceptors.add(
          InterceptorsWrapper(
            onRequest: (options, handler) async {
              final token = await _sessionStore.readAccessToken();
              if (token != null && token.isNotEmpty) {
                options.headers['Authorization'] = 'Bearer $token';
              }
              handler.next(options);
            },
          ),
        );
  }

  final Dio dio;
  final GpAppConfig _config;
  final SecureSessionStore _sessionStore;

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    final res = await _request<Object?>((client) => client.get<Object?>(path, queryParameters: query));
    return _asMap(res.data);
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final res = await _request<Object?>((client) => client.get<Object?>(path, queryParameters: query));
    if (res.data is List) return res.data as List<dynamic>;
    final body = _asMap(res.data);
    final items = body['items'] ?? body['data'] ?? body['results'];
    return items is List ? items : const [];
  }

  Future<Map<String, dynamic>> postJson(String path, Map<String, dynamic> body) async {
    final res = await _request<Object?>((client) => client.post<Object?>(path, data: body));
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> patchJson(String path, Map<String, dynamic> body) async {
    final res = await _request<Object?>((client) => client.patch<Object?>(path, data: body));
    return _asMap(res.data);
  }

  Future<Response<T>> _request<T>(Future<Response<T>> Function(Dio client) run) async {
    try {
      return await run(dio);
    } on DioException catch (error) {
      if (_shouldRetryWithFallback(error)) {
        dio.options.baseUrl = _config.normalizedFallbackApiBaseUrl;
        try {
          return await run(dio);
        } on DioException catch (fallbackError) {
          throw GpApiException.fromDio(fallbackError, activeBaseUrl: dio.options.baseUrl);
        }
      }
      throw GpApiException.fromDio(error, activeBaseUrl: dio.options.baseUrl);
    }
  }

  bool _shouldRetryWithFallback(DioException error) {
    if (!_config.hasFallbackApiBaseUrl) return false;
    if (dio.options.baseUrl == _config.normalizedFallbackApiBaseUrl) return false;
    return error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.unknown;
  }

  Map<String, dynamic> _asMap(Object? value) {
    if (value is Map) return value.cast<String, dynamic>();
    return <String, dynamic>{};
  }
}

class GpApiException implements Exception {
  const GpApiException(this.message);

  final String message;

  factory GpApiException.fromDio(DioException error, {required String activeBaseUrl}) {
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.unknown) {
      return GpApiException(
        'Нет связи с сервером GP API ($activeBaseUrl). Проверьте интернет, DNS/VPN/Private DNS на телефоне или пересоберите приложение с API_URL.',
      );
    }
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map && data['message'] != null) {
      return GpApiException(data['message'].toString());
    }
    if (status != null) {
      return GpApiException('Сервер GP API вернул ошибку $status.');
    }
    return GpApiException('Ошибка GP API: ${error.message ?? error.type.name}');
  }

  @override
  String toString() => message;
}

String formatGpMobileError(Object error) {
  if (error is GpApiException) return error.message;
  return error.toString();
}
