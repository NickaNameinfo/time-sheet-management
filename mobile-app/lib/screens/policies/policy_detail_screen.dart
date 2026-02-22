import 'package:flutter/material.dart';

enum PolicyType {
  privacy,
  terms,
  cancellation,
  payment,
  gst,
}

extension PolicyTypeExt on PolicyType {
  String get title {
    switch (this) {
      case PolicyType.privacy:
        return 'Privacy Policy';
      case PolicyType.terms:
        return 'Terms and Conditions';
      case PolicyType.cancellation:
        return 'Cancellation & Account Policy';
      case PolicyType.payment:
        return 'Payment Policy';
      case PolicyType.gst:
        return 'GST Policy';
    }
  }

  String get content {
    switch (this) {
      case PolicyType.privacy:
        return '''
We respect your privacy and are committed to protecting your personal data. This policy explains how we collect, use, and safeguard your information when you use our app and investment services.

1. Information we collect
• Account and profile information (name, email, phone)
• KYC details (bank, Aadhaar, PAN) as required for investment
• Usage data and device information

2. How we use your information
• To provide and improve our services
• To verify your identity and comply with regulations
• To communicate with you about your account and investments

3. Data security
We use encryption and secure storage for sensitive data. Your KYC and financial details are handled in line with applicable laws.

4. Sharing of data
We do not sell your personal data. We may share information only as required by law or with service providers who assist us under strict confidentiality.

5. Your rights
You may request access, correction, or deletion of your personal data by contacting us.

Last updated: Please refer to the current version on our platform.
''';
      case PolicyType.terms:
        return '''
By using this app and our investment services, you agree to the following terms and conditions.

1. Eligibility
You must be eligible to invest as per applicable laws. You represent that all information provided by you is true and complete.

2. Use of services
• You will use the app and investment features only for lawful purposes.
• You are responsible for keeping your login credentials secure.
• You must complete KYC as required before investing.

3. Investments
• Investment plans, returns, and lock-in terms are as described at the time of investment.
• We do not guarantee returns; past performance is not indicative of future results.
• Withdrawal is subject to the holding period and policy stated in the app.

4. Prohibited conduct
You may not misuse the app, attempt unauthorised access, or violate any applicable law.

5. Changes
We may update these terms. Continued use after changes constitutes acceptance.

6. Governing law
These terms are governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts as per applicable law.

Last updated: Please refer to the current version on our platform.
''';
      case PolicyType.cancellation:
        return '''
Cancellation & Account Policy

1. Account closure
• You may request account closure at any time from Settings.
• Closure will be processed after resolving any pending investments or withdrawals as per the withdrawal policy.

2. Investment cancellation
• Once an investment is made, it cannot be cancelled. You may withdraw only after the minimum holding period (e.g. 15 days) and as per the plan’s lock-in and withdrawal policy.
• Withdrawal before the lock-in period may allow principal only (no interest), as shown in the app.

3. KYC and verification
• If your KYC is rejected, you will be notified with the reason. You may resubmit after correcting the details.
• Account access for investment may be restricted until KYC is verified.

4. Data retention
After account closure, we may retain certain data as required by law or for legitimate business purposes.

5. Contact
For cancellation or account-related requests, use the in-app support or contact details provided in the app.

Last updated: Please refer to the current version on our platform.
''';
      case PolicyType.payment:
        return '''
Payment Policy

1. Investment payments
• Investments are made through the payment methods enabled in the app.
• You must have sufficient balance or limit for the chosen amount.
• Minimum and maximum investment amounts are as specified for each plan.

2. Processing
• Payment is processed at the time of confirmation. Your investment is recorded once payment is successful.
• You will receive a transaction reference and confirmation in the app.

3. Withdrawals
• Withdrawals are subject to the minimum holding period (e.g. 15 days) and plan lock-in.
• Eligible amount (principal and interest, if applicable) will be credited to your registered bank account as per our processing timelines.
• You are responsible for ensuring your bank details in KYC are correct.

4. Refunds
• Investments are generally not refundable. Withdrawal is as per the Cancellation & Account Policy and plan terms.
• In case of a failed or duplicate transaction, we will investigate and resolve as per our procedures.

5. Fees and charges
Any fees or charges applicable to investments or withdrawals will be disclosed in the app before you confirm.

Last updated: Please refer to the current version on our platform.
''';
      case PolicyType.gst:
        return '''
GST Policy

1. Applicability
Goods and Services Tax (GST) or other applicable taxes may apply to fees, charges, or services as per Indian tax laws.

2. Tax on services
• Where GST is applicable on our services or charges, it will be shown separately or included as per the display in the app.
• Tax rates are as per the prevailing law at the time of the transaction.

3. Investment and interest
• Investment amounts and interest earned may be subject to tax as per your individual tax position and applicable income tax laws.
• We may issue statements or information required for your tax compliance. You are responsible for reporting income and paying taxes as applicable.

4. Invoices
If you require a tax invoice or GST invoice for any charge or fee, please contact us through the app or provided contact details.

5. Changes in tax law
We will comply with changes in GST or other tax laws and may update this policy and our systems accordingly.

Last updated: Please refer to the current version on our platform.
''';
    }
  }

  IconData get icon {
    switch (this) {
      case PolicyType.privacy:
        return Icons.privacy_tip_outlined;
      case PolicyType.terms:
        return Icons.description_outlined;
      case PolicyType.cancellation:
        return Icons.cancel_outlined;
      case PolicyType.payment:
        return Icons.payment_rounded;
      case PolicyType.gst:
        return Icons.receipt_long_outlined;
    }
  }
}

class PolicyDetailScreen extends StatelessWidget {
  final PolicyType policyType;

  const PolicyDetailScreen({super.key, required this.policyType});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(policyType.title),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  Icon(policyType.icon, size: 40, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      policyType.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.06),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: SelectableText(
                policyType.content,
                style: TextStyle(
                  fontSize: 15,
                  height: 1.5,
                  color: Colors.grey.shade800,
                ),
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
