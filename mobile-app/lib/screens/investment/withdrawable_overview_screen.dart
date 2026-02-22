import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:timesheet_mobile/screens/investment/withdraw_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_reports_screen.dart';
import 'package:intl/intl.dart';

/// Minimum withdrawal amount (must match backend MIN_WITHDRAWAL_AMOUNT).
const double kMinWithdrawalAmount = 5;

class WithdrawableOverviewScreen extends StatefulWidget {
  const WithdrawableOverviewScreen({super.key});

  @override
  State<WithdrawableOverviewScreen> createState() => _WithdrawableOverviewScreenState();
}

class _WithdrawableOverviewScreenState extends State<WithdrawableOverviewScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  Map<String, dynamic>? _dashboard;
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
      if (mounted) {
        setState(() {
          _dashboard = dash;
          _investments = list is List ? list : [];
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

  double _num(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v.toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0;
  }

  @override
  Widget build(BuildContext context) {
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final formatDecimals = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    if (_loading) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('Withdrawable'),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    if (_error != null) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('Withdrawable'),
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
                FilledButton.icon(
                  onPressed: _load,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Retry'),
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final withdrawable = _num(_dashboard?['withdrawable_balance']);
    final referralApproved = _num(_dashboard?['referral_balance_approved']);
    final fromInvestments = (withdrawable - referralApproved).clamp(0.0, double.infinity);
    final pendingRequests = _dashboard?['pending_withdrawal_requests'] as List? ?? [];
    final activeInvestments = _investments.where((e) => e['status']?.toString() == 'ACTIVE').toList();

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar(
        'Withdrawable',
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
            tooltip: 'History',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
          children: [
            // Min withdrawal info
            Container(
              padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
              decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kPrimary),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Minimum withdrawal', style: InvestmentTheme.sectionTitle(context)),
                  const SizedBox(height: 8),
                  Text(
                    '₹${kMinWithdrawalAmount.toInt()}',
                    style: InvestmentTheme.amountHighlight(fontSize: 22),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Amounts below ₹${kMinWithdrawalAmount.toInt()} cannot be withdrawn. Complete KYC to withdraw.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Total withdrawable
            Container(
              padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
              decoration: InvestmentTheme.cardDecoration(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Total withdrawable', style: InvestmentTheme.sectionTitle(context)),
                  const SizedBox(height: 8),
                  Text(
                    withdrawable >= 1 ? format.format(withdrawable) : formatDecimals.format(withdrawable),
                    style: InvestmentTheme.amountHighlight(color: InvestmentTheme.kInfo, fontSize: 24),
                  ),
                  if (referralApproved > 0 || fromInvestments > 0) ...[
                    const SizedBox(height: 12),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    _row('From investments', fromInvestments >= 1 ? format.format(fromInvestments) : formatDecimals.format(fromInvestments)),
                    if (referralApproved > 0)
                      _row('Referral approved', formatDecimals.format(referralApproved)),
                  ],
                ],
              ),
            ),
            if (pendingRequests.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Pending withdrawal requests', style: InvestmentTheme.sectionTitle(context)),
              const SizedBox(height: 8),
              ...pendingRequests.take(5).map<Widget>((r) {
                final invId = r['investment_id'];
                final amt = _num(r['amount_after_deduction']);
                final requestedAt = r['requested_at']?.toString();
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => WithdrawScreen(investmentId: invId))).then((_) => _load()),
                    borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                    child: Container(
                      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                      decoration: InvestmentTheme.cardDecoration(color: Colors.orange.shade50),
                      child: Row(
                        children: [
                          Icon(Icons.schedule_rounded, color: Colors.orange.shade700, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(formatDecimals.format(amt), style: InvestmentTheme.amountHighlight(fontSize: 16)),
                                if (requestedAt != null)
                                  Text('Requested ${InvestmentTheme.formatMaturityDate(requestedAt)}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ],
            const SizedBox(height: 16),
            Text('Withdraw from investment', style: InvestmentTheme.sectionTitle(context)),
            const SizedBox(height: 6),
            Text(
              'Tap an investment to see withdrawal details and confirm. Minimum ₹${kMinWithdrawalAmount.toInt()} per withdrawal.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
            ),
            const SizedBox(height: 12),
            if (activeInvestments.isEmpty)
              Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: InvestmentTheme.cardDecoration(),
                child: Row(
                  children: [
                    Icon(Icons.savings_rounded, color: Colors.grey.shade400, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'No active investments to withdraw.',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ),
                  ],
                ),
              )
            else
              ...activeInvestments.map<Widget>((e) {
                final id = e['id'];
                final amt = _num(e['amount']);
                final planName = e['plan_name']?.toString() ?? 'Plan';
                final maturityStr = e['maturity_date']?.toString();
                final maturityFormatted = InvestmentTheme.formatMaturityDate(maturityStr);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => WithdrawScreen(investmentId: id))).then((_) => _load()),
                    borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                    child: Container(
                      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                      decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kInfo.withOpacity(0.5)),
                      child: Row(
                        children: [
                          Icon(Icons.account_balance_wallet_rounded, color: InvestmentTheme.kInfo, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(planName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                Text('Maturity: $maturityFormatted', style: InvestmentTheme.dateHighlight(fontSize: 13)),
                              ],
                            ),
                          ),
                          Text(format.format(amt), style: InvestmentTheme.amountHighlight(fontSize: 16)),
                          const SizedBox(width: 8),
                          const Icon(Icons.chevron_right_rounded),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
