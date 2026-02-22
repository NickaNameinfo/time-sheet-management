import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_reports_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:timesheet_mobile/screens/investment/kyc_form_screen.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:timesheet_mobile/utils/razorpay_platform.dart';

class InvestmentCheckoutScreen extends StatefulWidget {
  final int planId;
  final String planName;
  final double minAmount;
  final double? maxAmount;
  final double interestPercentage;
  final int lockinDays;

  const InvestmentCheckoutScreen({
    super.key,
    required this.planId,
    required this.planName,
    required this.minAmount,
    this.maxAmount,
    required this.interestPercentage,
    required this.lockinDays,
  });

  @override
  State<InvestmentCheckoutScreen> createState() => _InvestmentCheckoutScreenState();
}

class _InvestmentCheckoutScreenState extends State<InvestmentCheckoutScreen> {
  final _api = InvestmentApiService();
  final _amountController = TextEditingController();
  Map<String, dynamic>? _validation;
  bool _validating = false;
  bool _paying = false;
  String? _error;
  Timer? _debounceTimer;
  String? _kycStatus; // VERIFIED | PENDING_VERIFICATION | null

  late RazorpayCheckout _razorpay; // razorpay_flutter on mobile, razorpay_web on web
  double? _pendingAmount; // amount for success callback

  @override
  void initState() {
    super.initState();
    _amountController.text = widget.minAmount.toStringAsFixed(0);
    _validate();
    _loadKycStatus();
    _razorpay = RazorpayCheckout();
    _razorpay.on(RazorpayCheckout.eventPaymentSuccess, _handlePaymentSuccess);
    _razorpay.on(RazorpayCheckout.eventPaymentError, _handlePaymentError);
    _razorpay.on(RazorpayCheckout.eventExternalWallet, _handleExternalWallet);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _razorpay.clear();
    _amountController.dispose();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    final amount = _pendingAmount;
    if (amount == null) {
      if (mounted) setState(() => _paying = false);
      return;
    }
    final paymentId = response.paymentId ?? response.orderId ?? 'rzp_${DateTime.now().millisecondsSinceEpoch}';
    _api.paymentSuccess(planId: widget.planId, amount: amount, transactionId: paymentId).then((_) {
      if (!mounted) return;
      setState(() {
        _paying = false;
        _pendingAmount = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Investment successful!')));
      Navigator.pop(context, true);
    }).catchError((e) {
      if (mounted) {
        setState(() {
          _paying = false;
          _pendingAmount = null;
          _error = _messageFromError(e);
        });
      }
    });
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (mounted) {
      setState(() {
        _paying = false;
        _pendingAmount = null;
        _error = response.message ?? 'Payment failed.';
      });
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (mounted) {
      setState(() {
        _paying = false;
        _pendingAmount = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('External wallet: ${response.walletName}')),
      );
    }
  }

  Future<void> _loadKycStatus() async {
    try {
      final data = await _api.getKycStatus();
      if (mounted) setState(() => _kycStatus = data['status']?.toString());
    } catch (_) {
      if (mounted) setState(() => _kycStatus = null);
    }
  }

  void _scheduleValidate() {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (mounted) _validate();
    });
  }

  String? _validateAmount() {
    final raw = _amountController.text.trim();
    if (raw.isEmpty) return 'Please enter an amount.';
    final amt = double.tryParse(raw);
    if (amt == null) return 'Please enter a valid number.';
    if (amt < widget.minAmount) {
      final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
      return 'Minimum investment for this plan is ${format.format(widget.minAmount)}.';
    }
    if (widget.maxAmount != null && amt > widget.maxAmount!) {
      final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
      return 'Maximum for this plan is ${format.format(widget.maxAmount)}.';
    }
    return null;
  }

  String _messageFromError(Object e) {
    if (e is DioException && e.response?.data is Map) {
      final data = e.response!.data as Map;
      final msg = data['Message'] ?? data['message'] ?? data['Error'];
      if (msg != null && msg.toString().trim().isNotEmpty) return msg.toString().trim();
    }
    final s = e.toString().replaceFirst('Exception: ', '');
    if (s.contains('DioException') || s.contains('status code')) return 'Something went wrong. Please check the amount and try again.';
    return s;
  }

  Future<void> _validate() async {
    final validationError = _validateAmount();
    if (validationError != null) {
      setState(() {
        _error = validationError;
        _validation = null;
      });
      return;
    }
    final amt = double.tryParse(_amountController.text.trim())!;
    setState(() {
      _validating = true;
      _error = null;
      _validation = null;
    });
    try {
      final data = await _api.validateCheckout(planId: widget.planId, amount: amt);
      if (mounted) setState(() {
        _validation = data;
        _validating = false;
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = _messageFromError(e);
        _validation = null;
        _validating = false;
      });
    }
  }

  Future<void> _proceedToPayment() async {
    final validationError = _validateAmount();
    if (validationError != null) {
      setState(() => _error = validationError);
      return;
    }
    final amt = double.tryParse(_amountController.text.trim())!;
    setState(() {
      _paying = true;
      _error = null;
      _pendingAmount = amt;
    });
    try {
      final orderData = await _api.createRazorpayOrder(planId: widget.planId, amount: amt);
      final orderId = orderData['id'] as String?;
      final amountPaise = orderData['amount'];
      final currency = orderData['currency'] as String? ?? 'INR';
      if (orderId == null || amountPaise == null) {
        throw Exception('Invalid order response');
      }
      final options = {
        'key': AppConfig.razorpayKey,
        'amount': amountPaise is int ? amountPaise : (amountPaise as num).toInt(),
        'currency': currency,
        'order_id': orderId,
        'name': 'Nickname Infotech',
        'description': 'Investment – ${widget.planName}',
        'theme': {'color': '#49a84c'},
      };
      _razorpay.open(options, context);
    } on MissingPluginException catch (_) {
      if (mounted) setState(() {
        _paying = false;
        _pendingAmount = null;
        _error = 'Razorpay is not available on this platform. Use the website (Chrome) or the Android/iOS app to pay.';
      });
    } catch (e) {
      if (mounted) setState(() {
        _error = _messageFromError(e);
        _paying = false;
        _pendingAmount = null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final maxStr = widget.maxAmount != null ? format.format(widget.maxAmount) : 'No max';

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar('Checkout'),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentReportsScreen())),
        icon: const Icon(Icons.history_rounded),
        label: const Text('History'),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      body: ListView(
        padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
        children: [
          if (_kycStatus != 'VERIFIED') ...[
            Container(
              padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
              decoration: InvestmentTheme.cardDecoration(color: Colors.orange.shade50),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.verified_user_outlined, color: Colors.orange.shade700, size: 24),
                      const SizedBox(width: 10),
                      Text(
                        'Verify KYC',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You can invest now. Complete KYC to withdraw your amount at maturity. Withdrawal is allowed only after verification.',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.4),
                  ),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const KycFormScreen()),
                      );
                      _loadKycStatus();
                    },
                    icon: const Icon(Icons.verified_user_rounded, size: 20),
                    label: const Text('Verify KYC'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.orange.shade700,
                      minimumSize: const Size.fromHeight(44),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          Semantics(
            label: 'Plan: ${widget.planName}. Interest ${widget.interestPercentage}%. Lock-in ${widget.lockinDays} days.',
            child: Container(
              padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
              decoration: InvestmentTheme.cardWithAccent(InvestmentTheme.kPrimary),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.planName, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Chip(label: Text('${widget.interestPercentage}% interest'), avatar: Icon(Icons.percent, size: 18, color: InvestmentTheme.kSuccess)),
                      Chip(label: Text('${widget.lockinDays} days lock-in'), avatar: Icon(Icons.lock_clock_rounded, size: 18, color: InvestmentTheme.kInfo)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Amount range: ${format.format(widget.minAmount)} – $maxStr', style: TextStyle(fontSize: 14, color: Colors.grey.shade700)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          TextFormField(
            controller: _amountController,
            decoration: const InputDecoration(
              labelText: 'Investment Amount',
              border: OutlineInputBorder(),
              prefixText: '₹ ',
              filled: true,
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onChanged: (_) {
              setState(() => _validation = null);
              _scheduleValidate();
            },
            onFieldSubmitted: (_) {
              _debounceTimer?.cancel();
              _validate();
            },
          ),
          const SizedBox(height: 8),
          Text('Min ${format.format(widget.minAmount)}${widget.maxAmount != null ? ' • Max $maxStr' : ''}', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _validating ? null : _validate,
            icon: _validating ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.refresh_rounded),
            label: Text(_validating ? 'Updating…' : 'Update summary'),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
          if (_validation != null) ...[
            const SizedBox(height: 24),
            Semantics(
              label: 'Summary. Amount, interest, lock-in, estimated return, maturity date.',
              child: Container(
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                decoration: InvestmentTheme.cardDecoration(color: InvestmentTheme.kSuccess.withOpacity(0.08)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Summary', style: InvestmentTheme.sectionTitle(context)),
                    const SizedBox(height: 12),
                    _summaryRow('Amount', format.format(_validation!['amount']), valueStyle: InvestmentTheme.amountHighlight(fontSize: 16)),
                    _summaryRow('Interest', '${_validation!['interest_percentage']}%'),
                    _summaryRow('Lock-in', '${_validation!['lockin_days']} days'),
                    _summaryRow('Est. return', format.format(_validation!['estimated_return']), valueStyle: InvestmentTheme.earningsHighlight(fontSize: 16)),
                    _summaryRow('Maturity date', InvestmentTheme.formatMaturityDate(_validation!['maturity_date']?.toString()), valueStyle: InvestmentTheme.dateHighlight(fontSize: 14)),
                  ],
                ),
              ),
            ),
          ],
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
          FilledButton.icon(
            onPressed: (_validation == null || _paying) ? null : _proceedToPayment,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
              backgroundColor: InvestmentTheme.kPrimary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            icon: _paying ? const SizedBox.shrink() : const Icon(Icons.payment_rounded, size: 22),
            label: _paying
                ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Proceed to Payment'),
          ),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {TextStyle? valueStyle}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade700)),
          Text(value, style: valueStyle ?? const TextStyle(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
