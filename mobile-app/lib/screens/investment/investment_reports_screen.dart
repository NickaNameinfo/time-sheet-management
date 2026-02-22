import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:intl/intl.dart';

class InvestmentReportsScreen extends StatefulWidget {
  const InvestmentReportsScreen({super.key});

  @override
  State<InvestmentReportsScreen> createState() => _InvestmentReportsScreenState();
}

class _InvestmentReportsScreenState extends State<InvestmentReportsScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  final TextEditingController _viewByIdController = TextEditingController();
  List<dynamic> _reports = [];
  bool _loading = true;
  String? _error;
  String? _dateFrom;
  String? _dateTo;
  String? _status;
  String? _planType;
  String? _amountMin;
  String? _amountMax;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _viewByIdController.dispose();
    super.dispose();
  }

  Future<void> _openReportById(String idStr) async {
    final id = int.tryParse(idStr.trim());
    if (id == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid report ID')));
      return;
    }
    try {
      final report = await _api.getReportById(id);
      if (!mounted) return;
      _showReportDialog(report);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  void _showReportDialog(Map<String, dynamic> r) {
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final amt = double.tryParse(r['amount']?.toString() ?? '') ?? 0;
    final earned = double.tryParse(r['earned_amount']?.toString() ?? '') ?? 0;
    final planName = r['plan_name']?.toString() ?? '—';
    final status = r['status']?.toString() ?? '—';
    final startFormatted = InvestmentTheme.formatMaturityDate(r['start_date']?.toString());
    final maturityFormatted = InvestmentTheme.formatMaturityDate(r['maturity_date']?.toString());
    final daysHeld = r['days_held']?.toString() ?? '—';
    final interest = r['interest_percentage']?.toString() ?? '—';
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Report #${r['id'] ?? ""}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _detailRow('Amount', format.format(amt), valueStyle: InvestmentTheme.amountHighlight(fontSize: 16)),
              _detailRow('Status', status),
              _detailRow('Plan', planName),
              _detailRow('Start date', startFormatted, valueStyle: InvestmentTheme.dateHighlight(fontSize: 14)),
              _detailRow('Maturity date', maturityFormatted, valueStyle: InvestmentTheme.dateHighlight(fontSize: 14)),
              _detailRow('Days held', daysHeld, valueStyle: InvestmentTheme.dateHighlight(fontSize: 14)),
              _detailRow('Interest', '$interest%'),
              _detailRow('Earned', format.format(earned), valueStyle: InvestmentTheme.earningsHighlight(fontSize: 16)),
              if (r['transaction_id'] != null) _detailRow('Transaction ID', r['transaction_id']!.toString()),
              if (r['status'] == 'WITHDRAWN') ...[
                const SizedBox(height: 8),
                if (r['settlement_status'] != null && r['settlement_status'].toString().isNotEmpty)
                  _detailRow('Settlement status', r['settlement_status']!.toString(), valueStyle: TextStyle(fontWeight: FontWeight.w600, color: _settlementStatusColor(r['settlement_status']?.toString()), fontSize: 14)),
                if (r['settlement_amount'] != null && r['settlement_date'] != null) ...[
                  _detailRow('Settlement amount', format.format(double.tryParse(r['settlement_amount'].toString()) ?? 0), valueStyle: InvestmentTheme.amountHighlight(fontSize: 16)),
                  _detailRow('Settlement date', InvestmentTheme.formatMaturityDate(r['settlement_date']?.toString()), valueStyle: InvestmentTheme.dateHighlight(fontSize: 14)),
                ],
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value, {bool bold = false, Color? valueColor, TextStyle? valueStyle}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 100, child: Text(label, style: TextStyle(color: Colors.grey.shade700, fontSize: 14))),
          Expanded(child: Text(value, style: valueStyle ?? TextStyle(fontWeight: bold ? FontWeight.bold : null, color: valueColor ?? null, fontSize: 14))),
        ],
      ),
    );
  }

  Color _settlementStatusColor(String? s) {
    if (s == null) return Colors.grey;
    switch (s.toUpperCase()) {
      case 'PENDING':
        return Colors.orange;
      case 'PROCESSING':
        return InvestmentTheme.kInfo;
      case 'SETTLED':
        return InvestmentTheme.kSuccess;
      default:
        return Colors.grey;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _api.getReports(
        dateFrom: _dateFrom,
        dateTo: _dateTo,
        status: _status,
        planType: _planType,
        amountMin: _amountMin != null && _amountMin!.isNotEmpty ? double.tryParse(_amountMin!) : null,
        amountMax: _amountMax != null && _amountMax!.isNotEmpty ? double.tryParse(_amountMax!) : null,
      );
      final list = data['reports'];
      if (mounted) setState(() {
        _reports = list is List ? list : [];
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
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar('Investment Reports'),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
        icon: const Icon(Icons.history_rounded),
        label: const Text('History'),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: InvestmentTheme.kCardPadding, vertical: 12),
            decoration: BoxDecoration(color: Colors.white, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))]),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  SizedBox(
                    width: 120,
                    child: TextField(
                      decoration: const InputDecoration(labelText: 'From', border: OutlineInputBorder(), isDense: true, filled: true),
                      onChanged: (v) => _dateFrom = v.isEmpty ? null : v,
                    ),
                  ),
                  const SizedBox(width: 8),
                  SizedBox(
                    width: 120,
                    child: TextField(
                      decoration: const InputDecoration(labelText: 'To', border: OutlineInputBorder(), isDense: true, filled: true),
                      onChanged: (v) => _dateTo = v.isEmpty ? null : v,
                    ),
                  ),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: _status,
                    hint: const Text('Status'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('All')),
                      DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                      DropdownMenuItem(value: 'MATURED', child: Text('Matured')),
                      DropdownMenuItem(value: 'WITHDRAWN', child: Text('Withdrawn')),
                    ],
                    onChanged: (v) => setState(() {
                      _status = v;
                      _load();
                    }),
                  ),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: _planType,
                    hint: const Text('Plan'),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('All')),
                      DropdownMenuItem(value: 'below_5000', child: Text('Below 5K')),
                      DropdownMenuItem(value: 'above_5000', child: Text('5K+')),
                    ],
                    onChanged: (v) => setState(() {
                      _planType = v;
                      _load();
                    }),
                  ),
                  const SizedBox(width: 8),
                  FilledButton.icon(onPressed: _load, icon: const Icon(Icons.search_rounded, size: 20), label: const Text('Apply'), style: FilledButton.styleFrom(minimumSize: const Size(0, 44))),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _viewByIdController,
                    decoration: const InputDecoration(
                      labelText: 'View by report ID',
                      border: OutlineInputBorder(),
                      filled: true,
                    ),
                    keyboardType: TextInputType.number,
                    onSubmitted: _openReportById,
                  ),
                ),
                const SizedBox(width: 12),
                FilledButton(
                  onPressed: () => _openReportById(_viewByIdController.text),
                  style: FilledButton.styleFrom(minimumSize: const Size(0, 48)),
                  child: const Text('View'),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
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
                              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh_rounded), label: const Text('Retry'), style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48))),
                            ],
                          ),
                        ),
                      )
                    : _reports.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.assignment_outlined, size: 56, color: Colors.grey.shade400),
                                const SizedBox(height: 16),
                                Text('No records', style: TextStyle(fontSize: 16, color: Colors.grey.shade600)),
                              ],
                            ),
                          )
                        : ListView(
                            padding: const EdgeInsets.symmetric(horizontal: InvestmentTheme.kCardPadding),
                            children: [
                              ..._reports.map<Widget>((r) {
                                final amt = double.tryParse(r['amount']?.toString() ?? '') ?? 0;
                                final earned = double.tryParse(r['earned_amount']?.toString() ?? '') ?? 0;
                                final daysHeld = r['days_held']?.toString() ?? '—';
                                final planName = r['plan_name']?.toString() ?? '—';
                                final status = r['status']?.toString() ?? '—';
                                return Semantics(
                                  button: true,
                                  label: 'Report. Amount ${format.format(amt)}, $planName, earned ${format.format(earned)}. Tap for details.',
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kPrimary.withOpacity(0.3)),
                                    child: InkWell(
                                      onTap: () => _showReportDialog(Map<String, dynamic>.from(r)),
                                      borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                                      child: Padding(
                                        padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                              children: [
                                                Text(format.format(amt), style: InvestmentTheme.amountHighlight()),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                  decoration: BoxDecoration(
                                                    color: status == 'ACTIVE' ? InvestmentTheme.kInfo.withOpacity(0.15) : (status == 'MATURED' ? InvestmentTheme.kSuccess.withOpacity(0.15) : Colors.grey.withOpacity(0.15)),
                                                    borderRadius: BorderRadius.circular(8),
                                                  ),
                                                  child: Text(status, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: status == 'ACTIVE' ? InvestmentTheme.kInfo : (status == 'MATURED' ? InvestmentTheme.kSuccess : Colors.grey.shade700))),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 8),
                                            Text(planName, style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
                                            Text('Start: ${InvestmentTheme.formatMaturityDate(r['start_date']?.toString())} • Maturity: ${InvestmentTheme.formatMaturityDate(r['maturity_date']?.toString())}', style: InvestmentTheme.dateHighlight(fontSize: 13)),
                                            Text('Days held: $daysHeld • Interest: ${r['interest_percentage']}%', style: InvestmentTheme.dateHighlight(fontSize: 13)),
                                            const SizedBox(height: 6),
                                            Text('Earned: ${format.format(earned)}', style: InvestmentTheme.earningsHighlight()),
                                            if (status == 'WITHDRAWN' && (r['settlement_amount'] != null || r['settlement_status'] != null)) ...[
                                              if (r['settlement_status'] != null && r['settlement_status'].toString().isNotEmpty)
                                                Padding(
                                                  padding: const EdgeInsets.only(bottom: 4),
                                                  child: Row(
                                                    children: [
                                                      Text('Settlement status: ', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                                                      Container(
                                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                        decoration: BoxDecoration(
                                                          color: _settlementStatusColor(r['settlement_status']?.toString()).withOpacity(0.15),
                                                          borderRadius: BorderRadius.circular(6),
                                                        ),
                                                        child: Text(
                                                          r['settlement_status']?.toString() ?? '—',
                                                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _settlementStatusColor(r['settlement_status']?.toString())),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              if (r['settlement_amount'] != null && r['settlement_date'] != null)
                                                Text(
                                                  'Settlement: ${format.format(double.tryParse(r['settlement_amount'].toString()) ?? 0)} on ${InvestmentTheme.formatMaturityDate(r['settlement_date']?.toString())}',
                                                  style: InvestmentTheme.amountHighlight(fontSize: 13),
                                                ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                              const SizedBox(height: 80),
                            ],
                          ),
          ),
        ],
      ),
    );
  }
}
