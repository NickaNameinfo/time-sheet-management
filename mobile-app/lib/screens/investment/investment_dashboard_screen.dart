import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_plans_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_reports_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:timesheet_mobile/screens/investment/withdraw_screen.dart';
import 'package:timesheet_mobile/screens/investment/withdrawable_overview_screen.dart';
import 'package:timesheet_mobile/screens/investment/referral_screen.dart';
import 'package:intl/intl.dart';

class InvestmentDashboardScreen extends StatefulWidget {
  const InvestmentDashboardScreen({super.key});

  @override
  State<InvestmentDashboardScreen> createState() => _InvestmentDashboardScreenState();
}

class _InvestmentDashboardScreenState extends State<InvestmentDashboardScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  Map<String, dynamic>? _data;
  List<dynamic> _investments = [];
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
      final dash = await _api.getDashboard();
      final list = await _api.listInvestments();
      if (mounted) setState(() {
        _data = dash;
        _investments = list;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Widget _investFab() {
    return FloatingActionButton.extended(
      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentPlansScreen())),
      backgroundColor: Colors.red,
      foregroundColor: Colors.white,
      icon: const Icon(Icons.trending_up_rounded),
      label: const Text('Invest'),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(backgroundColor: InvestmentTheme.kBackground, floatingActionButton: _investFab(), floatingActionButtonLocation: FloatingActionButtonLocation.endFloat, body: const Center(child: CircularProgressIndicator()));
    if (_error != null) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('Investment Dashboard'),
        floatingActionButton: _investFab(),
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

    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final formatDecimals = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
    final totalInvested = _toNum(_data?['total_invested']);
    final totalEarnings = _toNum(_data?['total_earnings']);
    final withdrawable = _toNum(_data?['withdrawable_balance']);
    final referralApproved = _toNum(_data?['referral_balance_approved']);
    final referralPending = _toNum(_data?['referral_balance_pending']);
    final active = (int.tryParse(_data?['total_active']?.toString() ?? '') ?? 0);
    final matured = (int.tryParse(_data?['total_matured']?.toString() ?? '') ?? 0);
    final upcoming = _data?['upcoming_maturity'] as List? ?? [];
    final pendingWithdrawals = _data?['pending_withdrawal_requests'] as List? ?? [];
    final recentApproved = _data?['recent_approved_withdrawal'] as Map<String, dynamic>?;

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar(
        'Investment Dashboard',
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart_rounded),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
            tooltip: 'Reports',
            style: IconButton.styleFrom(minimumSize: const Size(InvestmentTheme.kMinTouchTarget, InvestmentTheme.kMinTouchTarget)),
          ),
        ],
      ),
      floatingActionButton: _investFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
          children: [
            Row(
              children: [
                Expanded(child: _statCard('Total Invested', format.format(totalInvested), Icons.account_balance_wallet_rounded, InvestmentTheme.kPrimary)),
                const SizedBox(width: 12),
                Expanded(child: _statCard('Earnings', format.format(totalEarnings), Icons.trending_up_rounded, InvestmentTheme.kSuccess)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const WithdrawableOverviewScreen())).then((_) => _load()),
                    borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                    child: _statCard(
                      'Withdrawable',
                      withdrawable >= 1 ? format.format(withdrawable) : formatDecimals.format(withdrawable),
                      Icons.savings_rounded,
                      InvestmentTheme.kInfo,
                      subtitle: referralApproved > 0 ? 'Includes ${formatDecimals.format(referralApproved)} referral' : null,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: _statCard('Active', active.toString(), Icons.pending_rounded, Colors.orange)),
              ],
            ),
            const SizedBox(height: 12),
            _statCard('Matured', matured.toString(), Icons.check_circle_rounded, Colors.teal),
            const SizedBox(height: 12),
            InkWell(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen())).then((_) => _load()),
              borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: InvestmentTheme.cardDecoration(color: InvestmentTheme.kPrimary.withOpacity(0.06)),
                child: Row(
                  children: [
                    CircleAvatar(backgroundColor: InvestmentTheme.kPrimary.withOpacity(0.2), child: const Icon(Icons.people_rounded, color: InvestmentTheme.kPrimary)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Refer & Earn', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                          Text('2% of friend\'s first investment.', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                          Text('Approved: ${formatDecimals.format(referralApproved)} • Pending: ${formatDecimals.format(referralPending)}', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: InvestmentTheme.kPrimary)),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            _buildWithdrawalStatusSection(format, pendingWithdrawals, recentApproved),
            const SizedBox(height: 28),
            Divider(height: 1, color: Colors.grey.shade300),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Upcoming Maturity', style: InvestmentTheme.sectionTitle(context)),
                TextButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
                  child: const Text('History'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (upcoming.isEmpty)
              Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: InvestmentTheme.cardDecoration(),
                child: Row(children: [Icon(Icons.event_available_rounded, color: Colors.grey.shade400), const SizedBox(width: 12), Text('No upcoming maturity', style: TextStyle(color: Colors.grey.shade600))]),
              )
            else
              ...upcoming.take(5).map<Widget>((e) {
                final id = e['id'];
                final amt = double.tryParse(e['amount']?.toString() ?? '') ?? 0;
                final dateStr = e['maturity_date']?.toString();
                final maturityFormatted = InvestmentTheme.formatMaturityDate(dateStr);
                return Semantics(
                  button: true,
                  label: 'Investment ${format.format(amt)}, maturity $maturityFormatted. Tap to withdraw.',
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: InvestmentTheme.cardDecoration(),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      leading: CircleAvatar(backgroundColor: InvestmentTheme.kInfo.withOpacity(0.2), child: const Icon(Icons.calendar_today_rounded, color: InvestmentTheme.kInfo)),
                      title: Text(format.format(amt), style: InvestmentTheme.amountHighlight(fontSize: 16)),
                      subtitle: Text('Maturity: $maturityFormatted', style: InvestmentTheme.dateHighlight(fontSize: 13)),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => WithdrawScreen(investmentId: id))).then((_) => _load()),
                    ),
                  ),
                );
              }),
            const SizedBox(height: 28),
            Divider(height: 1, color: Colors.grey.shade300),
            const SizedBox(height: 20),
            Text('Active investments', style: InvestmentTheme.sectionTitle(context)),
            const SizedBox(height: 12),
            ...(_investments.where((i) => i['status'] == 'ACTIVE').map<Widget>((inv) {
              final id = inv['id'];
              final amt = double.tryParse(inv['amount']?.toString() ?? '') ?? 0;
              final maturityStr = inv['maturity_date']?.toString();
              final planName = inv['plan_name']?.toString() ?? '—';
              final maturityFormatted = InvestmentTheme.formatMaturityDate(maturityStr);
              return Semantics(
                button: true,
                label: '${format.format(amt)}, $planName, maturity $maturityFormatted. Tap to withdraw.',
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: InvestmentTheme.cardDecoration(),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    leading: CircleAvatar(backgroundColor: InvestmentTheme.kSuccess.withOpacity(0.2), child: const Icon(Icons.savings_rounded, color: InvestmentTheme.kSuccess)),
                    title: Text(format.format(amt), style: InvestmentTheme.amountHighlight(fontSize: 16)),
                    subtitle: Text('$planName • Maturity: $maturityFormatted', style: InvestmentTheme.dateHighlight(fontSize: 13)),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => WithdrawScreen(investmentId: id))).then((_) => _load()),
                  ),
                ),
              );
            })),
            if (_investments.where((i) => i['status'] == 'ACTIVE').isEmpty)
              Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: InvestmentTheme.cardDecoration(),
                child: Row(children: [Icon(Icons.inventory_2_outlined, color: Colors.grey.shade400), const SizedBox(width: 12), Text('No active investments', style: TextStyle(color: Colors.grey.shade600))]),
              ),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _buildWithdrawalStatusSection(NumberFormat format, List<dynamic> pendingWithdrawals, Map<String, dynamic>? recentApproved) {
    final hasPending = pendingWithdrawals.isNotEmpty;
    final hasRecent = recentApproved != null;
    if (!hasPending && !hasRecent) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Current withdrawal status', style: InvestmentTheme.sectionTitle(context)),
        const SizedBox(height: 12),
        if (hasPending)
          Container(
            padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
            decoration: InvestmentTheme.cardDecoration(color: Colors.orange.shade50),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.schedule_rounded, color: Colors.orange.shade700, size: 22),
                    const SizedBox(width: 10),
                    Text('Pending approval', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.orange.shade900, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 8),
                Text('${pendingWithdrawals.length} withdrawal request(s) awaiting admin approval.', style: TextStyle(color: Colors.orange.shade800, fontSize: 14)),
                ...pendingWithdrawals.take(3).map<Widget>((r) {
                  final invId = r['investment_id'];
                  final amt = double.tryParse(r['amount_after_deduction']?.toString() ?? '') ?? 0;
                  final requestedAt = r['requested_at']?.toString();
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: InkWell(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => WithdrawScreen(investmentId: invId))).then((_) => _load()),
                      borderRadius: BorderRadius.circular(8),
                      child: Row(
                        children: [
                          Text(format.format(amt), style: InvestmentTheme.amountHighlight(fontSize: 14)),
                          const SizedBox(width: 8),
                          if (requestedAt != null)
                            Text('Requested ${InvestmentTheme.formatMaturityDate(requestedAt)}', style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                          const Spacer(),
                          const Icon(Icons.chevron_right, size: 20),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        if (hasPending && hasRecent) const SizedBox(height: 12),
        if (hasRecent)
          Container(
            padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
            decoration: InvestmentTheme.cardDecoration(color: InvestmentTheme.kSuccess.withOpacity(0.12)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: InvestmentTheme.kSuccess, size: 22),
                    const SizedBox(width: 10),
                    Text('Last approved', style: TextStyle(fontWeight: FontWeight.w600, color: InvestmentTheme.kSuccess, fontSize: 15)),
                  ],
                ),
                const SizedBox(height: 8),
                Text(format.format(double.tryParse(recentApproved['amount_after_deduction']?.toString() ?? '') ?? 0), style: InvestmentTheme.amountHighlight(fontSize: 16)),
                if (recentApproved['settlement_date'] != null)
                  Text('Settlement by: ${InvestmentTheme.formatMaturityDate(recentApproved['settlement_date']?.toString())}', style: InvestmentTheme.dateHighlight(fontSize: 13)),
              ],
            ),
          ),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color, {String? subtitle}) {
    return Semantics(
      label: '$label: $value${subtitle != null ? '. $subtitle' : ''}',
      child: Container(
        padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
        decoration: InvestmentTheme.cardWithAccent(color),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 28, color: color),
            const SizedBox(height: 10),
            Text(value, style: InvestmentTheme.amountHighlight(color: color)),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(subtitle!, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
            ],
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }

  double _toNum(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v.toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0;
  }
}
