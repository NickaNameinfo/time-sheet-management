import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/theme/app_brand_colors.dart';
import 'package:timesheet_mobile/utils/payslip_format.dart';

class EmployeePayslipDetailScreen extends StatefulWidget {
  final String employeeId;
  final String startDate;
  final String endDate;
  final String title;

  const EmployeePayslipDetailScreen({
    super.key,
    required this.employeeId,
    required this.startDate,
    required this.endDate,
    required this.title,
  });

  @override
  State<EmployeePayslipDetailScreen> createState() => _EmployeePayslipDetailScreenState();
}

class _EmployeePayslipDetailScreenState extends State<EmployeePayslipDetailScreen> {
  final ApiService _api = ApiService();
  bool _loading = true;
  String? _error;
  Map<String, dynamic> _data = {};

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
      final data = await _api.getSalaryPayslipDetail(
        employeeId: widget.employeeId,
        startDate: widget.startDate,
        endDate: widget.endDate,
      );
      if (mounted) {
        setState(() {
          _data = data;
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

  Map<String, dynamic> get _employee {
    final e = _data['employee'];
    if (e is Map) return Map<String, dynamic>.from(e);
    return {};
  }

  Map<String, dynamic> get _company {
    final c = _data['company'];
    if (c is Map) return Map<String, dynamic>.from(c);
    final d = _data['payslipDetail'];
    if (d is Map && d['company'] is Map) {
      return Map<String, dynamic>.from(d['company'] as Map);
    }
    return {};
  }

  Map<String, dynamic> get _earnings {
    final d = _data['payslipDetail'];
    if (d is Map && d['earnings'] is Map) {
      return Map<String, dynamic>.from(d['earnings'] as Map);
    }
    return {};
  }

  Map<String, dynamic> get _deductions {
    final d = _data['payslipDetail'];
    if (d is Map && d['deductions'] is Map) {
      return Map<String, dynamic>.from(d['deductions'] as Map);
    }
    return {};
  }

  Map<String, dynamic> get _payment {
    final d = _data['payslipDetail'];
    if (d is Map && d['payment'] is Map) {
      return Map<String, dynamic>.from(d['payment'] as Map);
    }
    return {};
  }

  double get _monthPayable {
    final mp = parsePayAmount(_data['monthPayable']);
    if (mp > 0) return mp;
    return parsePayAmount(_data['regularPay']) + parsePayAmount(_data['holidayPay']);
  }

  double get _inHand {
    final d = _data['payslipDetail'];
    if (d is Map && d['inHandSalary'] != null) {
      final ih = parsePayAmount(d['inHandSalary']);
      if (ih > 0) return ih;
    }
    final fin = parsePayAmount(_data['finalAmount']);
    if (fin > 0) return fin;
    return _monthPayable;
  }

  String _shareText() {
    final emp = _employee;
    final buf = StringBuffer();
    buf.writeln(_company['name'] ?? 'Salary Slip');
    buf.writeln('Employee: ${emp['employeeName'] ?? ''} (${emp['empId'] ?? ''})');
    buf.writeln('Period: ${formatPayPeriod(widget.startDate, widget.endDate)}');
    buf.writeln('Month payable: ${formatPayslipMoney(_monthPayable)}');
    buf.writeln('In hand: ${formatPayslipMoney(_inHand)}');
    return buf.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppBrandColors.heroGradient),
        ),
        actions: [
          if (!_loading && _error == null)
            IconButton(
              icon: const Icon(Icons.copy),
              tooltip: 'Copy summary',
              onPressed: () {
                Clipboard.setData(ClipboardData(text: _shareText()));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Summary copied')),
                );
              },
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        FilledButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: _buildSlipCard(),
                ),
    );
  }

  Widget _buildSlipCard() {
    final emp = _employee;
    final periodStart = _data['period'] is Map
        ? (_data['period'] as Map)['startDate']?.toString()
        : widget.startDate;
    final periodEnd = _data['period'] is Map
        ? (_data['period'] as Map)['endDate']?.toString()
        : widget.endDate;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: Colors.black87, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _headerBlock(),
            _grayBar('Salary Slip'),
            _infoRow('Employee Name', emp['employeeName']?.toString() ?? '—'),
            _infoRow('Employee ID', emp['empId']?.toString() ?? '—'),
            _infoRow('Designation', emp['designation']?.toString() ?? '—'),
            _infoRow('Pay Period', formatPayPeriod(periodStart, periodEnd)),
            _infoRow(
              'Total salary (profile)',
              formatPayslipMoney(emp['baseSalary'] ?? _data['monthlySalary']),
            ),
            _infoRow('This month payable', formatPayslipMoney(_monthPayable), bold: true),
            if (parsePayAmount(_data['regularPay']) > 0 ||
                parsePayAmount(_data['holidayPay']) > 0)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Text(
                  'Regular: ${formatPayslipMoney(_data['regularPay'])} · '
                  'Holiday: ${formatPayslipMoney(_data['holidayPay'])} · '
                  'Weekend: ${formatPayslipMoney(_data['weekendPay'])} · '
                  'Extra: ${formatPayslipMoney(_data['extraPay'])}',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
            const Divider(height: 1),
            _earningsTable(),
            _grayBar('In Hand Salary: ${formatPayslipMoney(_inHand)}', fontSize: 13),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Text(
                'Payment: ${_payment['chqNumber'] ?? 'Account Transfer'} · '
                'Date: ${_payment['chqDate'] ?? '—'} · '
                'Bank: ${_payment['bankName'] ?? '—'}',
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _headerBlock() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Text(
            _company['name']?.toString() ?? 'Company',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          if (_company['address'] != null)
            Text(
              _company['address'].toString(),
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11),
            ),
          if (_company['phone'] != null)
            Text(_company['phone'].toString(), style: const TextStyle(fontSize: 11)),
        ],
      ),
    );
  }

  Widget _grayBar(String text, {double fontSize = 14}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      color: const Color(0xFFD9D9D9),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: TextStyle(fontWeight: FontWeight.bold, fontSize: fontSize),
      ),
    );
  }

  Widget _infoRow(String label, String value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(label, style: const TextStyle(fontSize: 12)),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: bold ? FontWeight.bold : FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _earningsTable() {
    const rows = [
      ['Basic', 'basic'],
      ['HRA', 'hra'],
      ['Conveyance', 'conveyanceAllowance'],
      ['Food Allowance', 'foodAllowance'],
      ['Medical', 'medicalExpenses'],
      ['Mobile', 'mobileAllowance'],
      ['Special', 'specialAllowance'],
    ];

    double sumEarn = 0;
    for (final r in rows) {
      sumEarn += parsePayAmount(_earnings[r[1]]);
    }
    if (sumEarn <= 0) sumEarn = _monthPayable;

    return Table(
      border: TableBorder.all(color: Colors.black87, width: 0.5),
      columnWidths: const {
        0: FlexColumnWidth(2),
        1: FlexColumnWidth(1),
        2: FlexColumnWidth(2),
        3: FlexColumnWidth(1),
      },
      children: [
        TableRow(
          decoration: const BoxDecoration(color: Color(0xFFD9D9D9)),
          children: [
            _tableCell('Earnings', bold: true),
            _tableCell('Amount', bold: true, align: TextAlign.right),
            _tableCell('Deductions', bold: true),
            _tableCell('Amount', bold: true, align: TextAlign.right),
          ],
        ),
        ...List.generate(7, (i) {
          final e = rows[i];
          const dedLabels = ['Advance', 'Mediclaim', 'TDS', 'Other', 'Prof. Tax', '', ''];
          const dedKeys = [
            'advance',
            'mediclaim',
            'tds',
            'otherDeduction',
            'professionalTax',
            null,
            null,
          ];
          final dedLabel = i < dedLabels.length ? dedLabels[i] : '';
          final dedKey = i < dedKeys.length ? dedKeys[i] : null;
          return TableRow(
            children: [
              _tableCell(e[0]),
              _tableCell(
                parsePayAmount(_earnings[e[1]]) > 0
                    ? formatPayslipMoney(_earnings[e[1]])
                    : '',
                align: TextAlign.right,
              ),
              _tableCell(dedLabel),
              _tableCell(
                dedKey != null && parsePayAmount(_deductions[dedKey]) > 0
                    ? formatPayslipMoney(_deductions[dedKey])
                    : dedKey == 'advance' ? '-' : '',
                align: TextAlign.right,
              ),
            ],
          );
        }),
        TableRow(
          decoration: const BoxDecoration(color: Color(0xFFD9D9D9)),
          children: [
            _tableCell('Gross (payable)', bold: true),
            _tableCell(formatPayslipMoney(sumEarn > 0 ? sumEarn : _monthPayable),
                bold: true, align: TextAlign.right),
            _tableCell('Total Deduction', bold: true),
            _tableCell(
              formatPayslipMoney(
                parsePayAmount(_deductions['advance']) +
                    parsePayAmount(_deductions['mediclaim']) +
                    parsePayAmount(_deductions['tds']) +
                    parsePayAmount(_deductions['otherDeduction']) +
                    parsePayAmount(_deductions['professionalTax']),
              ),
              bold: true,
              align: TextAlign.right,
            ),
          ],
        ),
      ],
    );
  }
}

class _tableCell extends StatelessWidget {
  final String text;
  final bool bold;
  final TextAlign align;

  const _tableCell(this.text, {this.bold = false, this.align = TextAlign.left});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(6),
      child: Text(
        text,
        textAlign: align,
        style: TextStyle(
          fontSize: 11,
          fontWeight: bold ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }
}
