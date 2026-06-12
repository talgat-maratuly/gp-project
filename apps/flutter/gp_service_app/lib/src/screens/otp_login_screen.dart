import 'package:flutter/material.dart';
import 'package:gp_mobile_shared/gp_mobile_shared.dart';

class OtpLoginScreen extends StatefulWidget {
  const OtpLoginScreen({
    super.key,
    required this.auth,
    required this.deviceIdProvider,
    required this.onSignedIn,
    required this.devOtpEnabled,
  });

  final AuthRepository auth;
  final Future<String> Function() deviceIdProvider;
  final void Function(GpSession session) onSignedIn;
  final bool devOtpEnabled;

  @override
  State<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends State<OtpLoginScreen> {
  final _phone = TextEditingController(text: '+77001110001');
  final _otp = TextEditingController();
  bool _sent = false;
  bool _loading = false;
  String? _devCode;
  String? _error;

  Future<void> _send() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await widget.auth.sendOtp(_phone.text);
      setState(() {
        _sent = true;
        _devCode = result.devCode;
        if (widget.devOtpEnabled && _otp.text.isEmpty) _otp.text = result.devCode ?? '0000';
      });
    } catch (e) {
      setState(() => _error = formatGpMobileError(e));
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final session = await widget.auth.verifyOtp(
        phone: _phone.text,
        code: _otp.text,
        deviceId: await widget.deviceIdProvider(),
      );
      widget.onSignedIn(session);
    } catch (e) {
      setState(() => _error = formatGpMobileError(e));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('GP Service')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Вход по телефону', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              const Text('OTP нужен только для первого входа или нового устройства.'),
              const SizedBox(height: 24),
              TextField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Телефон'),
              ),
              if (_sent) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _otp,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'OTP'),
                ),
              ],
              if (widget.devOtpEnabled || _devCode != null) ...[
                const SizedBox(height: 12),
                Text('DEV режим: используйте код ${_devCode ?? '0000'}'),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
              ],
              const Spacer(),
              FilledButton(
                onPressed: _loading ? null : (_sent ? _verify : _send),
                child: Text(_loading ? '...' : (_sent ? 'Войти' : 'Отправить OTP')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
