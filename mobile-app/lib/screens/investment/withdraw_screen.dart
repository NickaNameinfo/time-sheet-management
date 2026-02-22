import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_reports_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:timesheet_mobile/screens/investment/kyc_form_screen.dart';
import 'package:intl/intl.dart';

class WithdrawScreen extends StatefulWidget {
  final int investmentId;

  const WithdrawScreen({super.key, required this.investmentId});

  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  Map<String, dynamic>? _preview;
  bool _loading = true;
  bool _withdrawing = false;
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
      final data = await _api.getWithdrawPreview(widget.investmentId);
      if (mounted) setState(() {
        _preview = data;
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _confirmWithdraw() async {
    final requiresApproval = _preview?['requires_approval'] == true;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm withdrawal'),
        content: Text(
          requiresApproval
              ? '3% will be deducted and this request will be sent for admin approval. Continue?'
              : 'This will mark the investment as withdrawn. Continue?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Withdraw')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() {
      _withdrawing = true;
      _error = null;
    });
    try {
      final result = await _api.withdraw(widget.investmentId);
      if (!mounted) return;
      final status = result is Map ? result['status'] : null;
      if (status == 'PENDING_APPROVAL') {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Withdrawal request submitted. It will be processed after admin approval.'),
          duration: Duration(seconds: 4),
        ));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal processed.')));
      }
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _withdrawing = false;
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
    if (_error != null && _preview == null) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('Withdraw'),
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

    final p = _preview!;
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
    final invested = double.tryParse(p['invested_amount']?.toString() ?? '') ?? 0;
    final daysHolding = int.tryParse(p['days_holding']?.toString() ?? p['days_completed']?.toString() ?? '') ?? 0;
    const minHoldingDays = 15;
    final canWithdraw = p['can_withdraw'] == true;
    final earlyWithdrawal = p['early_withdrawal'] == true;
    final requiresApproval = p['requires_approval'] == true;
    final deductionPercent = (p['early_withdrawal_deduction_percent'] ?? 0) is int
        ? (p['early_withdrawal_deduction_percent'] as int).toDouble()
        : double.tryParse(p['early_withdrawal_deduction_percent']?.toString() ?? '') ?? 0;
    final deductionAmount = double.tryParse(p['deduction_amount']?.toString() ?? '') ?? 0;
    final amountAfterDeduction = double.tryParse(p['amount_after_deduction']?.toString() ?? '') ?? 0;
    final lockinDays = int.tryParse(p['lockin_days']?.toString() ?? '') ?? 0;
    final eligibleInterest = double.tryParse(p['eligible_interest']?.toString() ?? '') ?? 0;
    final totalWithdrawable = double.tryParse(p['total_withdrawable']?.toString() ?? '') ?? 0;
    final lockinCompleted = p['lockin_completed'] == true;
    final currentDtFormatted = InvestmentTheme.formatMaturityDate(p['current_datetime']?.toString());
    final withdrawalRequestStatus = p['withdrawal_request_status']?.toString();
    final withdrawalRequestedAt = p['withdrawal_requested_at']?.toString();
    final withdrawalReviewedAt = p['withdrawal_reviewed_at']?.toString();
    final withdrawalAdminNote = p['withdrawal_admin_note']?.toString();
    final settlementDate = p['settlement_date']?.toString();
    final settlementAmount = double.tryParse(p['settlement_amount']?.toString() ?? '') ?? 0.0;
    final hasPendingRequest = withdrawalRequestStatus == 'PENDING_APPROVAL';
    final minWithdrawalAmount = (p['min_withdrawal_amount'] is int)
        ? (p['min_withdrawal_amount'] as int).toDouble()
        : double.tryParse(p['min_withdrawal_amount']?.toString() ?? '') ?? 5.0;
    final belowMinWithdrawal = !canWithdraw && (earlyWithdrawal ? amountAfterDeduction : totalWithdrawable) < minWithdrawalAmount;
    final kycRequired = p['kyc_required'] == true;
    final kycMessage = p['kyc_message']?.toString() ?? 'Complete KYC verification to withdraw. Go to Investment → KYC and submit your details.';
    final canProceedWithdraw = !kycRequired && canWithdraw && !hasPendingRequest;

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar('Withdraw'),
      floatingActionButton: _historyFab(),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: ListView(
        padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
        children: [
          Semantics(
            label: 'Current date and time: $currentDtFormatted',
            child: Container(
              padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
              decoration: InvestmentTheme.cardDecoration(color: Colors.grey.shade50),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Current date & time', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.grey.shade700)),
                  const SizedBox(height: 4),
                  Text(currentDtFormatted, style: InvestmentTheme.dateHighlight(fontSize: 14)),
                ],
              ),
            ),
          ),
          if (kycRequired) ...[
            const SizedBox(height: 16),
            Semantics(
              liveRegion: true,
              label: 'KYC required. $kycMessage',
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.verified_user_rounded, color: Colors.orange.shade700, size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Complete KYC to withdraw', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.orange.shade900, fontSize: 15)),
                              const SizedBox(height: 4),
                              Text(kycMessage, style: TextStyle(color: Colors.orange.shade900, fontSize: 14)),
                              const SizedBox(height: 12),
                              FilledButton.icon(
                                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KycFormScreen())).then((_) => _load()),
                                icon: const Icon(Icons.arrow_forward_rounded, size: 18),
                                label: const Text('Go to KYC'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.orange.shade700,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Semantics(
            label: 'Withdrawal summary. Invested amount, days holding, lock-in, eligible interest, total withdrawable.',
            child: Container(
              padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
              decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kPrimary),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Withdrawal summary', style: InvestmentTheme.sectionTitle(context)),
                  const SizedBox(height: 12),
                  _row('Invested amount', format.format(invested), valueStyle: InvestmentTheme.amountHighlight(fontSize: 16)),
                  _row('Days holding', '$daysHolding', valueStyle: InvestmentTheme.dateHighlight(fontSize: 16)),
                  _row('Lock-in days', '$lockinDays'),
_row('Eligible interest', format.format(eligibleInterest), valueStyle: InvestmentTheme.earningsHighlight(fontSize: 16)),
                if (earlyWithdrawal && deductionAmount > 0) ...[
                  const Divider(),
                  _row('Early withdrawal fee (${deductionPercent.toInt()}%)', '-${format.format(deductionAmount)}', valueStyle: TextStyle(color: Colors.orange.shade800, fontSize: 16)),
                  _row('Amount you will receive', format.format(amountAfterDeduction), valueStyle: InvestmentTheme.amountHighlight(fontSize: 18)),
                ] else ...[
                  const Divider(),
                  _row('Total withdrawable', format.format(totalWithdrawable), valueStyle: InvestmentTheme.amountHighlight(fontSize: 18)),
                ],
                ],
              ),
            ),
          ),
          if (withdrawalRequestStatus != null && withdrawalRequestStatus.isNotEmpty) ...[
            const SizedBox(height: 16),
            Semantics(
              liveRegion: true,
              label: 'Payment status: $withdrawalRequestStatus',
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: InvestmentTheme.cardDecoration(
                  color: withdrawalRequestStatus == 'PENDING_APPROVAL'
                      ? Colors.orange.shade50
                      : withdrawalRequestStatus == 'APPROVED'
                          ? InvestmentTheme.kSuccess.withOpacity(0.12)
                          : Colors.red.shade50,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          withdrawalRequestStatus == 'PENDING_APPROVAL'
                              ? Icons.schedule_rounded
                              : withdrawalRequestStatus == 'APPROVED'
                                  ? Icons.check_circle_rounded
                                  : Icons.cancel_rounded,
                          size: 24,
                          color: withdrawalRequestStatus == 'PENDING_APPROVAL'
                              ? Colors.orange.shade700
                              : withdrawalRequestStatus == 'APPROVED'
                                  ? InvestmentTheme.kSuccess
                                  : Colors.red.shade700,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'Payment status',
                          style: InvestmentTheme.sectionTitle(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      withdrawalRequestStatus == 'PENDING_APPROVAL'
                          ? 'Pending approval'
                          : withdrawalRequestStatus == 'APPROVED'
                              ? 'Approved – withdrawal processed'
                              : 'Rejected',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: withdrawalRequestStatus == 'PENDING_APPROVAL'
                            ? Colors.orange.shade900
                            : withdrawalRequestStatus == 'APPROVED'
                                ? InvestmentTheme.kSuccess
                                : Colors.red.shade900,
                      ),
                    ),
                    if (withdrawalRequestedAt != null && withdrawalRequestedAt.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          'Requested: ${InvestmentTheme.formatMaturityDate(withdrawalRequestedAt)}',
                          style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                        ),
                      ),
                    if (withdrawalRequestStatus != 'PENDING_APPROVAL' && withdrawalReviewedAt != null && withdrawalReviewedAt.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          'Reviewed: ${InvestmentTheme.formatMaturityDate(withdrawalReviewedAt)}',
                          style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                        ),
                      ),
                    if (withdrawalRequestStatus == 'REJECTED' && withdrawalAdminNote != null && withdrawalAdminNote.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text(
                          'Note: $withdrawalAdminNote',
                          style: TextStyle(fontSize: 13, color: Colors.red.shade800, fontStyle: FontStyle.italic),
                        ),
                      ),
                    if (withdrawalRequestStatus == 'APPROVED' && settlementDate != null && settlementDate.isNotEmpty && settlementAmount != null && settlementAmount > 0)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: InvestmentTheme.kSuccess.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Settlement (36 hours after withdrawal)', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: Colors.grey.shade700)),
                              const SizedBox(height: 4),
                              Text(format.format(settlementAmount), style: InvestmentTheme.amountHighlight(fontSize: 18)),
                              Text('Expected by: ${InvestmentTheme.formatMaturityDate(settlementDate)}', style: InvestmentTheme.dateHighlight(fontSize: 14)),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          if (requiresApproval) ...[
            Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.blue.shade700, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Withdrawal before $minHoldingDays days: $deductionPercent% will be deducted. This request will be sent for admin approval.',
                        style: TextStyle(color: Colors.blue.shade900, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
          if (!canWithdraw) ...[
            Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.schedule_rounded, color: Colors.orange.shade700, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'You can withdraw only after $minHoldingDays days of holding. You have held for $daysHolding days.',
                        style: TextStyle(color: Colors.orange.shade900, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ] else if (!lockinCompleted && !earlyWithdrawal)
            Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.orange.shade700, size: 22),
                    const SizedBox(width: 10),
                    Expanded(child: Text('Interest not applicable. Withdraw principal only.', style: TextStyle(color: Colors.orange.shade900, fontSize: 14))),
                  ],
                ),
              ),
            ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Semantics(
              liveRegion: true,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12)),
                child: Row(children: [Icon(Icons.error_outline_rounded, color: Colors.red.shade700), const SizedBox(width: 8), Expanded(child: Text(_error!, style: TextStyle(color: Colors.red.shade900)))]),
              ),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: (_withdrawing || !canProceedWithdraw) ? null : _confirmWithdraw,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: _withdrawing
                ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(kycRequired ? 'Complete KYC to withdraw' : hasPendingRequest ? 'Withdrawal request pending' : 'Confirm withdrawal'),
          ),
          if (hasPendingRequest)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                'You already have a withdrawal request for this investment. Wait for admin approval.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              ),
            ),
          if (belowMinWithdrawal)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(InvestmentTheme.kCardRadius),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.orange.shade700, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Minimum withdrawal amount is ₹${minWithdrawalAmount.toInt()}. Your amount is below this.',
                        style: TextStyle(color: Colors.orange.shade900, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _row(String label, String value, {bool bold = false, bool highlight = false, TextStyle? valueStyle}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : null, color: highlight ? InvestmentTheme.kPrimary : null)),
          Text(value, style: valueStyle ?? TextStyle(fontWeight: bold ? FontWeight.bold : null, color: highlight ? InvestmentTheme.kPrimary : null, fontSize: highlight ? 16 : null)),
        ],
      ),
    );
  }
}
