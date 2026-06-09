import 'package:flutter/material.dart';
import 'package:gp_mobile_shared/gp_mobile_shared.dart';

class PartnerHomeScreen extends StatefulWidget {
  const PartnerHomeScreen({
    super.key,
    required this.api,
    required this.session,
    required this.onLogout,
  });

  final GpApiClient api;
  final GpSession session;
  final Future<void> Function() onLogout;

  @override
  State<PartnerHomeScreen> createState() => _PartnerHomeScreenState();
}

class _PartnerHomeScreenState extends State<PartnerHomeScreen> {
  late Future<List<dynamic>> _orders;

  @override
  void initState() {
    super.initState();
    _orders = widget.api.getList('/partner/orders/new');
  }

  Future<void> _reload() async {
    setState(() => _orders = widget.api.getList('/partner/orders/new'));
    await _orders;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GP Partner'),
        actions: [IconButton(onPressed: widget.onLogout, icon: const Icon(Icons.logout))],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<dynamic>>(
          future: _orders,
          builder: (context, snapshot) {
            final data = snapshot.data ?? const [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Партнер: ${widget.session.user.phone ?? widget.session.user.email ?? widget.session.user.id}'),
                const SizedBox(height: 16),
                const Text('Назначенные новые заявки', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Center(child: CircularProgressIndicator())
                else if (data.isEmpty)
                  const Text('Пока нет заявок')
                else
                  ...data.map((item) {
                    final map = item is Map ? item.cast<String, dynamic>() : <String, dynamic>{};
                    return Card(
                      child: ListTile(
                        title: Text(map['serviceName']?.toString() ?? map['id']?.toString() ?? 'Заявка'),
                        subtitle: Text(map['city']?.toString() ?? ''),
                        trailing: const Icon(Icons.chevron_right),
                      ),
                    );
                  }),
              ],
            );
          },
        ),
      ),
    );
  }
}
