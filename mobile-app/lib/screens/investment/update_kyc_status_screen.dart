import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:intl/intl.dart';

class UpdateKycStatusScreen extends StatefulWidget {
  const UpdateKycStatusScreen({super.key});

  @override
  State<UpdateKycStatusScreen> createState() => _UpdateKycStatusScreenState();
}

class _UpdateKycStatusScreenState extends State<UpdateKycStatusScreen> {
  final ApiService _api = ApiService();
  List<dynamic> _list = [];
  bool _loading = true;
  String? _error;
  int? _updatingUserId;

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
      final list = await _api.getInvestmentKycListAdmin();
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

  Future<void> _updateStatus(int userId, String status, {String? adminNote}) async {
    setState(() => _updatingUserId = userId);
    try {
      await _api.updateInvestmentKycStatus(userId: userId, status: status, adminNote: adminNote);
      if (mounted) {
        setState(() {
          _updatingUserId = null;
          _list = _list.map<dynamic>((r) {
            final m = Map<String, dynamic>.from(r);
            if (m['user_id'] == userId) {
              m['status'] = status;
              if (status == 'REJECTED' && adminNote != null) m['admin_note'] = adminNote;
            }
            return m;
          }).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('KYC status updated')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _updatingUserId = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
        );
      }
    }
  }

  Future<void> _showRejectDialog(int userId, String userName) async {
    final controller = TextEditingController();
    final note = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject KYC'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Reason (required):', style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                hintText: 'Enter reason for rejection',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () {
              final t = controller.text.trim();
              if (t.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a reason')));
                return;
              }
              Navigator.pop(ctx, t);
            },
            child: const Text('Reject'),
          ),
        ],
      ),
    );
    if (note != null && note.isNotEmpty) await _updateStatus(userId, 'REJECTED', adminNote: note);
  }

  String _formatDate(dynamic d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.tryParse(d.toString());
      return dt != null ? DateFormat.yMd().add_Hm().format(dt) : '—';
    } catch (_) {
      return d.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: AppBar(
        title: const Text('Update KYC Status'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loading ? null : _load,
            tooltip: 'Refresh',
            style: IconButton.styleFrom(minimumSize: const Size(InvestmentTheme.kMinTouchTarget, InvestmentTheme.kMinTouchTarget)),
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
              : _list.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.verified_user_outlined, size: 56, color: Colors.grey.shade400),
                          const SizedBox(height: 16),
                          Text('No KYC records', style: TextStyle(fontSize: 16, color: Colors.grey.shade600)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                        itemCount: _list.length,
                        itemBuilder: (context, index) {
                          final r = _list[index] as Map<String, dynamic>;
                          final userId = int.tryParse(r['user_id']?.toString() ?? '') ?? 0;
                          final status = r['status']?.toString() ?? '';
                          final isUpdating = _updatingUserId == userId;
                          final userName = r['user_name']?.toString() ?? '—';
                          final email = r['email']?.toString() ?? '—';
                          final bankHolder = r['bank_holder_name']?.toString() ?? '—';
                          final bankName = r['bank_name']?.toString() ?? '—';
                          final account = r['account_number']?.toString();
                          final aadhaar = r['aadhaar_number']?.toString();
                          final pan = r['pan_number']?.toString();
                          final address = r['address']?.toString();
                          final adminNote = r['admin_note']?.toString();
                          return Semantics(
                            label: 'KYC for $userName. Status: $status. Email: $email.',
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: InvestmentTheme.cardDecoration(),
                              child: Padding(
                                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        CircleAvatar(backgroundColor: InvestmentTheme.kPrimary.withOpacity(0.2), child: Text((userName.isNotEmpty ? userName[0] : '?').toUpperCase(), style: const TextStyle(color: InvestmentTheme.kPrimary, fontWeight: FontWeight.bold))),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(userName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                                              Text(email, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                                            ],
                                          ),
                                        ),
                                        _statusChip(status),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    _detailRow('Bank holder', bankHolder),
                                    _detailRow('Bank', bankName),
                                    if (account != null && account.isNotEmpty) _detailRow('Account', account),
                                    if (r['ifsc_code'] != null) _detailRow('IFSC', r['ifsc_code']?.toString() ?? '—'),
                                    if (r['branch'] != null) _detailRow('Branch', r['branch']?.toString() ?? '—'),
                                    if (address != null && address.isNotEmpty) _detailRow('Address', address),
                                    if (aadhaar != null && aadhaar.isNotEmpty) _detailRow('Aadhaar', aadhaar),
                                    if (pan != null && pan.isNotEmpty) _detailRow('PAN', pan),
                                    if (adminNote != null && adminNote.isNotEmpty) _detailRow('Admin note', adminNote),
                                    const SizedBox(height: 8),
                                    Text('Submitted: ${_formatDate(r['submitted_at'])}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                    if (r['verified_at'] != null) Text('Verified: ${_formatDate(r['verified_at'])}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                    const SizedBox(height: 12),
                                    Wrap(
                                      spacing: 8,
                                      runSpacing: 8,
                                      children: [
                                        if (status != 'PENDING_VERIFICATION')
                                          TextButton(
                                            onPressed: isUpdating ? null : () => _updateStatus(userId, 'PENDING_VERIFICATION'),
                                            child: isUpdating ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Set Pending'),
                                          ),
                                        if (status != 'VERIFIED')
                                          FilledButton(
                                            onPressed: isUpdating ? null : () => _updateStatus(userId, 'VERIFIED'),
                                            style: FilledButton.styleFrom(minimumSize: const Size(0, 44)),
                                            child: const Text('Verify'),
                                          ),
                                        if (status != 'REJECTED')
                                          OutlinedButton(
                                            onPressed: isUpdating ? null : () => _showRejectDialog(userId, userName),
                                            style: OutlinedButton.styleFrom(foregroundColor: Colors.red, minimumSize: const Size(0, 44)),
                                            child: const Text('Reject'),
                                          ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _statusChip(String status) {
    Color bg;
    if (status == 'VERIFIED') bg = InvestmentTheme.kSuccess.withOpacity(0.2);
    else if (status == 'REJECTED') bg = Colors.red.shade100;
    else bg = Colors.orange.shade100;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Text(status, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: status == 'VERIFIED' ? InvestmentTheme.kSuccess : (status == 'REJECTED' ? Colors.red.shade700 : Colors.orange.shade800))),
    );
  }

  Widget _detailRow(String label, String value) {
    if (value.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 90, child: Text('$label:', style: TextStyle(fontSize: 13, color: Colors.grey.shade700))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
