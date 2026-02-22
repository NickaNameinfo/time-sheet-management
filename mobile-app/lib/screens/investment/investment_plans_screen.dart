import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_checkout_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_reports_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:intl/intl.dart';

class InvestmentPlansScreen extends StatefulWidget {
  const InvestmentPlansScreen({super.key});

  @override
  State<InvestmentPlansScreen> createState() => _InvestmentPlansScreenState();
}

class _InvestmentPlansScreenState extends State<InvestmentPlansScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  List<dynamic> _plans = [];
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
      final data = await _api.getPlans();
      final list = data['plans'];
      if (mounted) setState(() {
        _plans = list is List ? list : [];
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return Scaffold(backgroundColor: InvestmentTheme.kBackground, floatingActionButton: _historyFab(), floatingActionButtonLocation: FloatingActionButtonLocation.endFloat, body: const Center(child: CircularProgressIndicator()));
    if (_error != null) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('Investment Plans'),
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

    final below = _plans.where((p) => p['category'] == 'below_5000').toList();
    final above = _plans.where((p) => p['category'] == 'above_5000').toList();
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar('Investment Plans'),
      floatingActionButton: _historyFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
          children: [
            Semantics(header: true, child: Text('Below ₹5,000', style: InvestmentTheme.sectionTitle(context))),
            const SizedBox(height: 12),
            ...below.map((p) => _planCard(p, format)),
            const SizedBox(height: InvestmentTheme.kSectionSpacing),
            Semantics(header: true, child: Text('₹5,000 and Above', style: InvestmentTheme.sectionTitle(context))),
            const SizedBox(height: 12),
            ...above.map((p) => _planCard(p, format)),
            const SizedBox(height: 80),
          ],
        ),
      ),
    );
  }

  Widget _historyFab() {
    return FloatingActionButton.extended(
      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
      icon: const Icon(Icons.history_rounded),
      label: const Text('History'),
    );
  }

  Widget _planCard(Map<String, dynamic> plan, NumberFormat format) {
    final min = double.tryParse(plan['min_amount']?.toString() ?? '') ?? 0;
    final max = double.tryParse(plan['max_amount']?.toString() ?? '') ?? 0;
    final interest = double.tryParse(plan['interest_percentage']?.toString() ?? '') ?? 0;
    final lockin = int.tryParse(plan['lockin_days']?.toString() ?? '') ?? 0;
    final name = plan['name']?.toString() ?? 'Plan';
    final id = int.tryParse(plan['id']?.toString() ?? '') ?? 0;
    final exampleAmount = min;
    final estimatedReturn = exampleAmount + (exampleAmount * interest / 100);

    return Semantics(
      button: true,
      label: '$name. Min ${format.format(min)}. $interest% interest, $lockin days lock-in. Proceed to checkout.',
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
        decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kPrimary),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: InvestmentTheme.kPrimary.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.savings_rounded, color: InvestmentTheme.kPrimary, size: 24),
                ),
                const SizedBox(width: 14),
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, letterSpacing: -0.2)),
              ],
            ),
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: [
              _chip('Min ${format.format(min)}', InvestmentTheme.kInfo),
              if (max < 999999999) _chip('Max ${format.format(max)}', InvestmentTheme.kInfo),
              _chip('$interest% interest', InvestmentTheme.kSuccess),
              _chip('$lockin days lock-in', Colors.orange),
            ]),
            const SizedBox(height: 12),
            Text(
              'Example: ${format.format(exampleAmount)} → ${format.format(estimatedReturn)} after $lockin days',
              style: InvestmentTheme.amountHighlight(fontSize: 13),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => InvestmentCheckoutScreen(planId: id, planName: name, minAmount: min, maxAmount: max < 999999999 ? max : null, interestPercentage: interest, lockinDays: lockin),
                  ),
                ).then((_) => _load()),
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  backgroundColor: InvestmentTheme.kPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.arrow_forward_rounded, size: 20),
                label: const Text('Proceed to checkout'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _chip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: color)),
    );
  }
}
