import 'package:flutter/material.dart';
import 'package:gp_mobile_shared/gp_mobile_shared.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.api,
    required this.session,
    required this.onLogout,
  });

  final GpApiClient api;
  final GpSession session;
  final Future<void> Function() onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Future<List<dynamic>> _services;

  @override
  void initState() {
    super.initState();
    _services = widget.api.getList('/services/catalog');
  }

  Future<void> _reload() async {
    setState(() => _services = widget.api.getList('/services/catalog'));
    await _services;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GP Service'),
        actions: [
          IconButton(onPressed: widget.onLogout, icon: const Icon(Icons.logout)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _reload,
        child: FutureBuilder<List<dynamic>>(
          future: _services,
          builder: (context, snapshot) {
            final data = snapshot.data ?? const [];
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Клиент: ${widget.session.user.phone ?? widget.session.user.email ?? widget.session.user.id}'),
                const SizedBox(height: 16),
                const Text('Услуги', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                const SizedBox(height: 12),
                if (snapshot.connectionState == ConnectionState.waiting)
                  const Center(child: CircularProgressIndicator())
                else if (data.isEmpty)
                  const Text('Пока нет услуг')
                else
                  ...data.map((item) {
                    final map = item is Map ? item.cast<String, dynamic>() : <String, dynamic>{};
                    return Card(
                      child: ListTile(
                        title: Text(map['name']?.toString() ?? map['title']?.toString() ?? 'Услуга'),
                        subtitle: Text(map['description']?.toString() ?? ''),
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
