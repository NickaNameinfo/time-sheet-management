import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/screens/employee_payslip_detail_screen.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/theme/app_brand_colors.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:timesheet_mobile/utils/payslip_format.dart';

class EmployeeMyPayslipsScreen extends StatefulWidget {
  const EmployeeMyPayslipsScreen({super.key});

  @override
  State<EmployeeMyPayslipsScreen> createState() => _EmployeeMyPayslipsScreenState();
}

class _EmployeeMyPayslipsScreenState extends State<EmployeeMyPayslipsScreen> {
  final ApiService _api = ApiService();
  final DateFormat _apiDateFmt = DateFormat('yyyy-MM-dd');
  final DateFormat _displayDateFmt = DateFormat('dd MMM yyyy');

  late DateTime _periodStart;
  late DateTime _periodEnd;
  bool _filterPaidByPeriod = true;

  bool _loadingPeriod = false;
  bool _loadingList = false;
  String? _periodError;
  String? _listError;
  Map<String, dynamic>? _periodPayload;
  List<dynamic> _paidList = [];

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _periodStart = DateTime(now.year, now.month, 1);
    _periodEnd = DateTime(now.year, now.month + 1, 0);
    _loadAll();
  }

  String get _startDate => _apiDateFmt.format(_periodStart);
  String get _endDate => _apiDateFmt.format(_periodEnd);

  List<dynamic> get _filteredPaidList {
    if (!_filterPaidByPeriod) return _paidList;
    return _paidList.where((item) {
      if (item is! Map) return false;
      final m = Map<String, dynamic>.from(item);
      return _payPeriodOverlapsFilter(
        m['periodStart']?.toString(),
        m['periodEnd']?.toString(),
      );
    }).toList();
  }

  bool _payPeriodOverlapsFilter(String? slipStart, String? slipEnd) {
    if (slipStart == null || slipEnd == null) return true;
    try {
      final s = DateTime.parse(slipStart.length >= 10 ? slipStart.substring(0, 10) : slipStart);
      final e = DateTime.parse(slipEnd.length >= 10 ? slipEnd.substring(0, 10) : slipEnd);
      final filterStart = DateTime(_periodStart.year, _periodStart.month, _periodStart.day);
      final filterEnd = DateTime(_periodEnd.year, _periodEnd.month, _periodEnd.day);
      return !e.isBefore(filterStart) && !s.isAfter(filterEnd);
    } catch (_) {
      return true;
    }
  }

  void _setMonthRange(DateTime month) {
    setState(() {
      _periodStart = DateTime(month.year, month.month, 1);
      _periodEnd = DateTime(month.year, month.month + 1, 0);
    });
  }

  Future<void> _loadAll() async {
    await Future.wait([_loadPeriodSummary(), _loadPaidList()]);
  }

  Future<void> _loadPeriodSummary() async {
    if (_periodEnd.isBefore(_periodStart)) {
      setState(() {
        _periodError = 'End date must be on or after start date';
        _loadingPeriod = false;
      });
      return;
    }
    setState(() {
      _loadingPeriod = true;
      _periodError = null;
    });
    try {
      final data = await _api.getMyPayslipPeriodSummary(
        startDate: _startDate,
        endDate: _endDate,
      );
      if (mounted) {
        setState(() {
          _periodPayload = data;
          _loadingPeriod = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _periodError = e.toString().replaceFirst('Exception: ', '');
          _loadingPeriod = false;
        });
      }
    }
  }

  Future<void> _loadPaidList() async {
    setState(() {
      _loadingList = true;
      _listError = null;
    });
    try {
      final list = await _api.getMyPaidPayslips();
      if (mounted) {
        setState(() {
          _paidList = list;
          _loadingList = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _listError = e.toString().replaceFirst('Exception: ', '');
          _loadingList = false;
        });
      }
    }
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _periodStart : _periodEnd;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035, 12, 31),
      helpText: isStart ? 'Period start' : 'Period end',
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _periodStart = picked;
          if (_periodEnd.isBefore(_periodStart)) {
            _periodEnd = _periodStart;
          }
        } else {
          _periodEnd = picked;
        }
      });
    }
  }

  Map<String, dynamic>? get _employeeRow {
    final e = _periodPayload?['employee'];
    if (e is Map) return Map<String, dynamic>.from(e);
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = AppConfig.displayNameForUser(user);
    final filteredPaid = _filteredPaidList;

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Payslips & Salary'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppBrandColors.heroGradient),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Hello, $name',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose a pay period to see hours and payable amount. Filter paid slips by the same dates.',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 16),
            _buildDateFilterCard(),
            const SizedBox(height: 16),
            if (_loadingPeriod)
              const Center(
                child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()),
              )
            else if (_periodError != null)
              _errorCard(_periodError!, _loadPeriodSummary)
            else if (_employeeRow != null)
              _buildPeriodSummary(_employeeRow!),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Paid salary slips',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                ),
                if (_filterPaidByPeriod)
                  Chip(
                    label: Text('${filteredPaid.length} in range'),
                    visualDensity: VisualDensity.compact,
                    backgroundColor: AppBrandColors.blue.withOpacity(0.12),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              title: const Text('Filter paid slips by selected dates', style: TextStyle(fontSize: 13)),
              value: _filterPaidByPeriod,
              onChanged: (v) => setState(() => _filterPaidByPeriod = v),
            ),
            const SizedBox(height: 8),
            if (_loadingList)
              const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
            else if (_listError != null)
              _errorCard(_listError!, _loadPaidList)
            else if (filteredPaid.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Icon(Icons.receipt_long, color: Colors.grey[400], size: 40),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          _filterPaidByPeriod
                              ? 'No paid slips for ${_displayDateFmt.format(_periodStart)} – ${_displayDateFmt.format(_periodEnd)}.'
                              : 'No paid payslips yet. When HR marks your salary as Paid, it will appear here.',
                          style: TextStyle(color: Colors.grey[700]),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...filteredPaid.map((item) => _paidSlipTile(item)),
          ],
        ),
      ),
    );
  }

  Widget _buildDateFilterCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Icon(Icons.date_range, color: Theme.of(context).colorScheme.primary, size: 20),
                const SizedBox(width: 8),
                const Text('Pay period', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _dateField(label: 'Start', date: _periodStart, isStart: true)),
                const SizedBox(width: 12),
                Expanded(child: _dateField(label: 'End', date: _periodEnd, isStart: false)),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ActionChip(
                  label: const Text('This month'),
                  onPressed: () {
                    _setMonthRange(DateTime.now());
                    _loadPeriodSummary();
                  },
                ),
                ActionChip(
                  label: const Text('Last month'),
                  onPressed: () {
                    final now = DateTime.now();
                    _setMonthRange(DateTime(now.year, now.month - 1));
                    _loadPeriodSummary();
                  },
                ),
                ActionChip(
                  avatar: const Icon(Icons.chevron_left, size: 18),
                  label: const Text('Prev'),
                  onPressed: () {
                    _setMonthRange(DateTime(_periodStart.year, _periodStart.month - 1));
                    _loadPeriodSummary();
                  },
                ),
                ActionChip(
                  avatar: const Icon(Icons.chevron_right, size: 18),
                  label: const Text('Next'),
                  onPressed: () {
                    _setMonthRange(DateTime(_periodStart.year, _periodStart.month + 1));
                    _loadPeriodSummary();
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _loadingPeriod ? null : _loadPeriodSummary,
              icon: _loadingPeriod
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.search),
              label: Text(_loadingPeriod ? 'Loading…' : 'Load period'),
              style: FilledButton.styleFrom(
                backgroundColor: AppBrandColors.blue,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dateField({
    required String label,
    required DateTime date,
    required bool isStart,
  }) {
    return InkWell(
      onTap: () => _pickDate(isStart: isStart),
      borderRadius: BorderRadius.circular(8),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          isDense: true,
          suffixIcon: const Icon(Icons.calendar_today, size: 18),
        ),
        child: Text(
          _displayDateFmt.format(date),
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }

  Widget _errorCard(String message, VoidCallback onRetry) {
    return Card(
      color: Colors.red.shade50,
      child: ListTile(
        leading: const Icon(Icons.error_outline, color: Colors.red),
        title: Text(message, style: const TextStyle(fontSize: 13)),
        trailing: TextButton(onPressed: onRetry, child: const Text('Retry')),
      ),
    );
  }

  Widget _buildPeriodSummary(Map<String, dynamic> row) {
    final payable = monthPayableFromRow(row);
    final status = row['status']?.toString() ?? 'draft';
    final canDownload = row['canDownload'] == true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          color: AppBrandColors.blue.withOpacity(0.06),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Text(
              'Showing: ${formatPayPeriod(_startDate, _endDate)}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _statChip('Check-ins', '${row['checkInCount'] ?? 0}', Icons.login),
            _statChip('Check-outs', '${row['checkOutCount'] ?? 0}', Icons.logout),
            _statChip('Reg. logged', _fmtH(row['loggedHours']), Icons.schedule),
            _statChip('Required', _fmtH(row['requiredHours']), Icons.access_time),
            _statChip('Regular hrs', _fmtH(row['regularHours']), Icons.timelapse),
            _statChip('Extra hrs', _fmtH(row['extraHours']), Icons.more_time, color: Colors.orange),
            _statChip('Weekend hrs', _fmtH(row['weekendHours']), Icons.weekend, color: Colors.purple),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          color: AppBrandColors.green.withOpacity(0.08),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Month payable', style: TextStyle(fontWeight: FontWeight.w600)),
                    Chip(
                      label: Text(status.toUpperCase()),
                      backgroundColor: status == 'paid' ? Colors.green.shade100 : Colors.grey.shade200,
                      labelStyle: TextStyle(
                        fontSize: 11,
                        color: status == 'paid' ? Colors.green.shade900 : Colors.grey.shade800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  formatPayslipMoney(payable),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppBrandColors.greenDark,
                  ),
                ),
                const SizedBox(height: 12),
                _payLine('Regular pay', row['regularPay']),
                _payLine('Holiday pay', row['holidayPay']),
                _payLine('Weekend (info)', row['weekendPay'], muted: true),
                _payLine('Extra (info)', row['extraPay'], muted: true),
                _payLine('Profile salary', row['totalSalary'] ?? row['baseSalary'], muted: true),
                if (canDownload) ...[
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () => _openPaidSlipFromPeriod(row),
                    icon: const Icon(Icons.picture_as_pdf_outlined),
                    label: const Text('View payslip for this period'),
                    style: FilledButton.styleFrom(backgroundColor: AppBrandColors.blue),
                  ),
                ] else
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Formal slip available after HR marks this period as Paid.',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _statChip(String label, String value, IconData icon, {Color? color}) {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 48) / 2,
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Icon(icon, size: 20, color: color ?? AppBrandColors.blue),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
                    Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _payLine(String label, dynamic amount, {bool muted = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 13, color: muted ? Colors.grey[600] : null)),
          Text(
            formatPayslipMoney(amount),
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: muted ? Colors.grey[700] : null,
            ),
          ),
        ],
      ),
    );
  }

  String _fmtH(dynamic v) {
    final n = double.tryParse(v?.toString() ?? '');
    if (n == null) return '0.00';
    return n.toStringAsFixed(2);
  }

  Widget _paidSlipTile(dynamic item) {
    final m = item is Map ? Map<String, dynamic>.from(item) : <String, dynamic>{};
    final label = m['periodLabel']?.toString() ?? m['periodMonth']?.toString() ?? 'Payslip';
    final start = m['periodStart']?.toString();
    final end = m['periodEnd']?.toString();
    final amount = m['finalAmount'];

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppBrandColors.green.withOpacity(0.15),
          child: const Icon(Icons.receipt, color: AppBrandColors.greenDark),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(formatPayPeriod(start, end)),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              formatPayslipMoney(amount),
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppBrandColors.greenDark),
            ),
            const Text('Paid', style: TextStyle(fontSize: 11, color: Colors.green)),
          ],
        ),
        onTap: () => _openPayslipDetail(
          employeeId: m['employeeId']?.toString(),
          startDate: start != null && start.length >= 10 ? start.substring(0, 10) : start,
          endDate: end != null && end.length >= 10 ? end.substring(0, 10) : end,
          title: label,
        ),
      ),
    );
  }

  void _openPaidSlipFromPeriod(Map<String, dynamic> row) {
    final period = row['period'];
    String? start;
    String? end;
    if (period is Map) {
      start = period['startDate']?.toString();
      end = period['endDate']?.toString();
    }
    _openPayslipDetail(
      employeeId: row['employeeId']?.toString(),
      startDate: start ?? _startDate,
      endDate: end ?? _endDate,
      title: formatPayPeriod(start ?? _startDate, end ?? _endDate),
    );
  }

  void _openPayslipDetail({
    required String? employeeId,
    required String? startDate,
    required String? endDate,
    required String title,
  }) {
    final user = context.read<AuthProvider>().user;
    final id = employeeId ?? AppConfig.employeeDbIdForApi(user);
    if (id == null || startDate == null || endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Missing employee or period information')),
      );
      return;
    }
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => EmployeePayslipDetailScreen(
          employeeId: id,
          startDate: startDate,
          endDate: endDate,
          title: title,
        ),
      ),
    );
  }
}
