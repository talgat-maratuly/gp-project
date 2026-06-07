enum GpAccountType { individual, legalEntity }

class GpSession {
  const GpSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    this.expiresIn,
  });

  final String accessToken;
  final String refreshToken;
  final GpUser user;
  final int? expiresIn;

  factory GpSession.fromJson(Map<String, dynamic> json) {
    final userJson = (json['user'] as Map?)?.cast<String, dynamic>() ?? const {};
    return GpSession(
      accessToken: json['accessToken']?.toString() ?? '',
      refreshToken: json['refreshToken']?.toString() ?? '',
      expiresIn: json['expiresIn'] is num ? (json['expiresIn'] as num).toInt() : null,
      user: GpUser.fromJson(userJson),
    );
  }
}

class GpUser {
  const GpUser({
    required this.id,
    required this.role,
    this.email,
    this.phone,
    this.name,
    this.roles = const [],
  });

  final String id;
  final String role;
  final String? email;
  final String? phone;
  final String? name;
  final List<String> roles;

  factory GpUser.fromJson(Map<String, dynamic> json) {
    final rawRoles = json['roles'];
    return GpUser(
      id: json['id']?.toString() ?? '',
      role: json['role']?.toString() ?? '',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      name: json['name']?.toString(),
      roles: rawRoles is List ? rawRoles.map((e) => e.toString()).toList() : const [],
    );
  }
}

class GpOtpSendResult {
  const GpOtpSendResult({
    required this.whatsappSent,
    this.devCode,
  });

  final bool whatsappSent;
  final String? devCode;

  factory GpOtpSendResult.fromJson(Map<String, dynamic> json) {
    return GpOtpSendResult(
      whatsappSent: json['whatsappSent'] != false,
      devCode: json['devCode']?.toString(),
    );
  }
}

class GpCity {
  const GpCity({required this.id, required this.name});

  final String id;
  final String name;

  factory GpCity.fromJson(Map<String, dynamic> json) {
    return GpCity(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

class GpOrderDraft {
  const GpOrderDraft({
    required this.serviceId,
    required this.city,
    required this.address,
    this.comment,
    this.payload = const {},
  });

  final String serviceId;
  final String city;
  final String address;
  final String? comment;
  final Map<String, dynamic> payload;

  Map<String, dynamic> toJson() => {
        'serviceId': serviceId,
        'city': city,
        'address': address,
        if (comment != null && comment!.trim().isNotEmpty) 'comment': comment,
        ...payload,
      };
}

