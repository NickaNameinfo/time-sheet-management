import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_reports_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:intl/intl.dart';

class InvestmentNotificationsScreen extends StatefulWidget {
  const InvestmentNotificationsScreen({super.key});

  @override
  State<InvestmentNotificationsScreen> createState() => _InvestmentNotificationsScreenState();
}

class _InvestmentNotificationsScreenState extends State<InvestmentNotificationsScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  List<dynamic> _list = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await _api.getNotifications();
      if (mounted) setState(() {
        _list = list;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Widget _historyFab() {
    return FloatingActionButton.extended(
      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
      icon: const Icon(Icons.history_rounded),
      label: const Text('History'),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(backgroundColor: InvestmentTheme.kBackground, floatingActionButton: _historyFab(), floatingActionButtonLocation: FloatingActionButtonLocation.endFloat, body: const Center(child: CircularProgressIndicator()));
    if (_error != null) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('Notifications'),
        floatingActionButton: _historyFab(),
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline_rounded, size: 48, color: Colors.red.shade400),
                const SizedBox(height: 16),
                Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade800)),
                const SizedBox(height: 24),
                FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh_rounded), label: const Text('Retry'), style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48))),
              ],
            ),
          ),
        ),
      );
    }
    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar('Investment Notifications'),
      floatingActionButton: _historyFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: _list.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none_rounded, size: 56, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text('No notifications', style: TextStyle(fontSize: 16, color: Colors.grey.shade600)),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                itemCount: _list.length,
                itemBuilder: (_, i) {
                  final n = _list[i];
                  final title = n['title']?.toString() ?? '';
                  final message = n['message']?.toString() ?? '';
                  final created = n['created_at']?.toString();
                  final read = n['read_at'] != null;
                  final dateStr = created != null ? DateFormat('MMM d, y • HH:mm').format(DateTime.parse(created).toLocal()) : '—';
                  return Semantics(
                    label: read ? '$title. $message. $dateStr' : 'Unread. $title. $message. $dateStr',
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: read ? InvestmentTheme.cardDecoration() : InvestmentTheme.cardWithAccent(InvestmentTheme.kInfo),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: InvestmentTheme.kCardPadding, vertical: 12),
                        leading: CircleAvatar(
                          backgroundColor: read ? Colors.grey.shade300 : InvestmentTheme.kInfo.withOpacity(0.2),
                          child: Icon(read ? Icons.notifications_rounded : Icons.notifications_active_rounded, color: read ? Colors.grey.shade600 : InvestmentTheme.kInfo, size: 22),
                        ),
                        title: Text(title, style: TextStyle(fontWeight: read ? FontWeight.normal : FontWeight.w600)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(message, style: TextStyle(fontSize: 14, color: Colors.grey.shade800)),
                            const SizedBox(height: 6),
                            Text(dateStr, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                          ],
                        ),
                        isThreeLine: true,
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
