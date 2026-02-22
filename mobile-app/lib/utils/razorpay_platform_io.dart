import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

export 'package:razorpay_flutter/razorpay_flutter.dart'
    show
        PaymentSuccessResponse,
        PaymentFailureResponse,
        ExternalWalletResponse;

/// Razorpay wrapper for Android/iOS. [context] is ignored.
class RazorpayCheckout {
  RazorpayCheckout() : _r = Razorpay();
  final Razorpay _r;

  static String get eventPaymentSuccess => Razorpay.EVENT_PAYMENT_SUCCESS;
  static String get eventPaymentError => Razorpay.EVENT_PAYMENT_ERROR;
  static String get eventExternalWallet => Razorpay.EVENT_EXTERNAL_WALLET;

  void on(String event, Function handler) => _r.on(event, handler);
  void clear() => _r.clear();

  void open(Map<String, dynamic> options, [BuildContext? context]) {
    _r.open(options);
  }
}
