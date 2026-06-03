import 'package:intl/intl.dart';

final _moneyIn = NumberFormat('#,##0.00', 'en_IN');

String formatPayslipMoney(dynamic value, {String symbol = '₹'}) {
  final n = double.tryParse(value?.toString() ?? '');
  if (n == null || n.isNaN) return '$symbol 0.00';
  return '$symbol${_moneyIn.format(n)}';
}

double parsePayAmount(dynamic value) {
  if (value == null) return 0;
  final s = value.toString().replaceAll(',', '').trim();
  return double.tryParse(s) ?? 0;
}

double monthPayableFromRow(Map<String, dynamic>? row) {
  if (row == null) return 0;
  final mp = parsePayAmount(row['monthPayable']);
  if (mp > 0) return mp;
  return parsePayAmount(row['regularPay']) + parsePayAmount(row['holidayPay']);
}

String formatPayPeriod(String? start, String? end) {
  if (start == null || end == null) return '—';
  try {
    final s = DateTime.parse(start.length >= 10 ? start.substring(0, 10) : start);
    final e = DateTime.parse(end.length >= 10 ? end.substring(0, 10) : end);
    final f = DateFormat('dd-MM-yyyy');
    return '${f.format(s)} to ${f.format(e)}';
  } catch (_) {
    return '$start to $end';
  }
}
