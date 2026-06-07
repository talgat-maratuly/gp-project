import 'package:dio/dio.dart';

import 'app_config.dart';
import 'secure_session_store.dart';

class GpApiClient {
  GpApiClient({
    required GpAppConfig config,
    required SecureSessionStore sessionStore,
    Dio? dio,
  })  : _sessionStore = sessionStore,
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
  final SecureSessionStore _sessionStore;

  Future<Map<String, dynamic>> getJson(String path, {Map<String, dynamic>? query}) async {
    final res = await dio.get<Object?>(path, queryParameters: query);
    return _asMap(res.data);
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final res = await dio.get<Object?>(path, queryParameters: query);
    if (res.data is List) return res.data as List<dynamic>;
    final body = _asMap(res.data);
    final items = body['items'] ?? body['data'] ?? body['results'];
    return items is List ? items : const [];
  }

  Future<Map<String, dynamic>> postJson(String path, Map<String, dynamic> body) async {
    final res = await dio.post<Object?>(path, data: body);
    return _asMap(res.data);
  }

  Future<Map<String, dynamic>> patchJson(String path, Map<String, dynamic> body) async {
    final res = await dio.patch<Object?>(path, data: body);
    return _asMap(res.data);
  }

  Map<String, dynamic> _asMap(Object? value) {
    if (value is Map) return value.cast<String, dynamic>();
    return <String, dynamic>{};
  }
}

