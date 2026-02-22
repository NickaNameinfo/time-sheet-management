import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';

class ReferralScreen extends StatefulWidget {
  const ReferralScreen({super.key});

  @override
  State<ReferralScreen> createState() => _ReferralScreenState();
}

class _ReferralScreenState extends State<ReferralScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  Map<String, dynamic>? _stats;
  List<dynamic> _history = [];
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
      final stats = await _api.getReferralStats();
      final history = await _api.getReferralHistory();
      if (mounted) {
        setState(() {
          _stats = stats;
          _history = history;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar(
        'Refer & Earn',
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loading ? null : _load,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.error_outline_rounded, size: 48, color: Colors.red.shade400),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade800)),
                        const SizedBox(height: 24),
                        FilledButton.icon(
                          onPressed: _load,
                          icon: const Icon(Icons.refresh_rounded),
                          label: const Text('Retry'),
                          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                    children: [
                      Text(
                        'Earn 2% of your referred friend\'s first investment. Amount is withdrawable after admin approval.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Expanded(
                            child: _statCard(
                              'Approved (Withdrawable)',
                              format.format((double.tryParse(_stats?['referral_balance_approved']?.toString() ?? '') ?? 0)),
                              Icons.check_circle_rounded,
                              InvestmentTheme.kSuccess,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _statCard(
                              'Pending approval',
                              format.format((double.tryParse(_stats?['referral_balance_pending']?.toString() ?? '') ?? 0)),
                              Icons.schedule_rounded,
                              Colors.orange,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _statCard(
                        'Total referrals',
                        '${_stats?['total_referrals'] ?? 0}',
                        Icons.people_rounded,
                        InvestmentTheme.kPrimary,
                      ),
                      const SizedBox(height: 28),
                      Divider(height: 1, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      Text('Referral history', style: InvestmentTheme.sectionTitle(context)),
                      const SizedBox(height: 12),
                      if (_history.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                          decoration: InvestmentTheme.cardDecoration(),
                          child: Row(
                            children: [
                              Icon(Icons.people_outline_rounded, color: InvestmentTheme.kPrimary.withOpacity(0.6)),
                              const SizedBox(width: 12),
                              Text('No referrals yet. Share your email so friends can enter it when they sign up.', style: TextStyle(color: Colors.grey.shade600)),
                            ],
                          ),
                        )
                      else
                        ..._history.map<Widget>((e) {
                          final referredEmail = e['referred_email']?.toString() ?? '—';
                          final referredName = e['referred_name']?.toString() ?? referredEmail;
                          final firstAmount = double.tryParse(e['first_investment_amount']?.toString() ?? '') ?? 0;
                          final referralAmount = double.tryParse(e['referral_amount']?.toString() ?? '') ?? 0;
                          final status = e['status']?.toString() ?? '—';
                          final createdAt = e['created_at']?.toString();
                          final approvedAt = e['approved_at']?.toString();
                          String dateStr = '—';
                          if (createdAt != null && createdAt.isNotEmpty) {
                            final dt = DateTime.tryParse(createdAt);
                            if (dt != null) dateStr = DateFormat('d MMM y').format(dt.toLocal());
                          }
                          Color statusColor = Colors.orange;
                          if (status == 'APPROVED') statusColor = InvestmentTheme.kSuccess;
                          if (status == 'REJECTED') statusColor = Colors.red;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kPrimary.withOpacity(0.4)),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                              leading: CircleAvatar(
                                backgroundColor: InvestmentTheme.kPrimary.withOpacity(0.2),
                                child: const Icon(Icons.person_rounded, color: InvestmentTheme.kPrimary),
                              ),
                              title: Text(referredName, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(referredEmail, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                  const SizedBox(height: 4),
                                  Text('First investment: ${format.format(firstAmount)} → 2%: ${format.format(referralAmount)}', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                                  const SizedBox(height: 2),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(color: statusColor.withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                                        child: Text(status.replaceAll('_', ' '), style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: statusColor)),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(dateStr, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                                    ],
                                  ),
                                ],
                              ),
                              isThreeLine: true,
                            ),
                          );
                        }),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
      decoration: InvestmentTheme.cardWithAccent(color),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 22),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade700))),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: InvestmentTheme.amountHighlight(fontSize: 18, color: color)),
        ],
      ),
    );
  }
}
