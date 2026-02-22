import 'package:flutter/material.dart';
import 'package:razorpay_web/razorpay_web.dart';

export 'package:razorpay_web/razorpay_web.dart'
    show
        PaymentSuccessResponse,
        PaymentFailureResponse,
        ExternalWalletResponse;

/// Razorpay wrapper for Web. [context] is used for checkout.
class RazorpayCheckout {
  RazorpayCheckout() : _r = Razorpay();
  final Razorpay _r;

  static String get eventPaymentSuccess => Razorpay.EVENT_PAYMENT_SUCCESS;
  static String get eventPaymentError => Razorpay.EVENT_PAYMENT_ERROR;
  static String get eventExternalWallet => Razorpay.EVENT_EXTERNAL_WALLET;

  void on(String event, Function handler) => _r.on(event, handler);
  void clear() => _r.clear();

  void open(Map<String, dynamic> options, [BuildContext? context]) {
    _r.open(options, context: context);
  }
}
