import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:timesheet_mobile/providers/challenge_auth_provider.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:timesheet_mobile/screens/investment/kyc_form_screen.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';

/// Support contact details shown on Profile.
const String kSupportEmail = 'bussiness@nicknameinfotech.com';
const String kSupportPhone = '8807834582';

/// Profile screen: user info, verification status, support details, and option to update verification document.
class ChallengeProfileScreen extends StatefulWidget {
  const ChallengeProfileScreen({super.key});

  @override
  State<ChallengeProfileScreen> createState() => _ChallengeProfileScreenState();
}

class _ChallengeProfileScreenState extends State<ChallengeProfileScreen> {
  final InvestmentApiService _api = InvestmentApiService();
  final ChallengeApiService _challengeApi = ChallengeApiService();
  String? _kycStatus;
  String? _documentVerificationStatus;
  bool _loading = true;
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
      final data = await _api.getKycStatus();
      if (mounted) {
        setState(() {
          _kycStatus = data['status']?.toString();
          _documentVerificationStatus = data['document_verification_status']?.toString();
          _loading = false;
        });
      }
    } catch (e) {
      final isSessionExpired = e is SessionExpiredException ||
          (e is DioException && e.error is SessionExpiredException);
      if (mounted) {
        setState(() {
          _kycStatus = null;
          _loading = false;
          if (!isSessionExpired) _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  bool get _isVerified => _kycStatus == 'VERIFIED';
  bool get _isPending => _kycStatus == 'PENDING_VERIFICATION';
  bool get _isRejected => _kycStatus == 'REJECTED';

  void _showChangePasswordDialog(BuildContext context) {
    final currentController = TextEditingController();
    final newController = TextEditingController();
    final confirmController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool loading = false;
    String? dialogError;

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Change password'),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      TextFormField(
                        controller: currentController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Current password',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: newController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'New password',
                          hintText: 'At least 6 characters',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Required';
                          if (v.length < 6) return 'At least 6 characters';
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: confirmController,
                        obscureText: true,
                        decoration: const InputDecoration(
                          labelText: 'Confirm new password',
                          border: OutlineInputBorder(),
                        ),
                        validator: (v) {
                          if (v != newController.text) return 'Passwords do not match';
                          return null;
                        },
                      ),
                      if (dialogError != null) ...[
                        const SizedBox(height: 12),
                        Text(dialogError!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
                      ],
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: loading ? null : () => Navigator.of(ctx).pop(),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: loading
                      ? null
                      : () async {
                          if (!formKey.currentState!.validate()) return;
                          setDialogState(() {
                            loading = true;
                            dialogError = null;
                          });
                          try {
                            await _challengeApi.changePassword(
                              currentPassword: currentController.text,
                              newPassword: newController.text,
                            );
                            if (!context.mounted) return;
                            Navigator.of(ctx).pop();
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Password changed'),
                                backgroundColor: Colors.green,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          } catch (e) {
                            setDialogState(() {
                              loading = false;
                              dialogError = e.toString().replaceFirst('Exception: ', '');
                            });
                          }
                        },
                  child: loading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Change password'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<ChallengeAuthProvider>().user;
    final name = user?['name']?.toString() ?? '—';
    final email = user?['email']?.toString() ?? '—';
    final phone = user?['phone']?.toString();

    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: AppBar(
        title: const Text('Profile'),
        centerTitle: false,
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                      decoration: InvestmentTheme.cardDecoration(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Account', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          _row('Name', name),
                          _row('Email', email),
                          if (phone != null && phone.isNotEmpty) _row('Phone', phone),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed: () => _showChangePasswordDialog(context),
                              icon: const Icon(Icons.lock_reset_rounded, size: 20),
                              label: const Text('Change password'),
                              style: OutlinedButton.styleFrom(
                                minimumSize: const Size.fromHeight(44),
                                foregroundColor: InvestmentTheme.kPrimary,
                                side: BorderSide(color: InvestmentTheme.kPrimary),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                      decoration: InvestmentTheme.cardDecoration(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text('Verification status', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                              const SizedBox(width: 10),
                              _verificationChip(),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (_documentVerificationStatus != null && _documentVerificationStatus!.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Text(
                                'Document verification: $_documentVerificationStatus',
                                style: TextStyle(fontSize: 13, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                              ),
                            ),
                          if (_isVerified)
                            Text(
                              'Your profile is verified. You can invest and withdraw.',
                              style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                            )
                          else if (_isPending)
                            Text(
                              'Your documents are under review. You can invest after admin verification.',
                              style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                            )
                          else if (_isRejected)
                            Text(
                              'Verification was not approved. You can resubmit documents below.',
                              style: TextStyle(fontSize: 14, color: Colors.orange.shade800),
                            )
                          else
                            Text(
                              'Submit bank and identity details to get verified and start investing.',
                              style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                            ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const KycFormScreen()),
                              ).then((_) => _load()),
                              icon: const Icon(Icons.upload_file_rounded),
                              label: const Text('Update verification document'),
                              style: FilledButton.styleFrom(
                                minimumSize: const Size.fromHeight(48),
                                backgroundColor: _isRejected ? Colors.orange : null,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Container(
                      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
                      decoration: InvestmentTheme.cardDecoration(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.support_agent_rounded, size: 22, color: InvestmentTheme.kPrimary),
                              const SizedBox(width: 8),
                              Text('Support', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Contact us for help with your account or investments.',
                            style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                          ),
                          const SizedBox(height: 12),
                          _supportRow(Icons.email_outlined, 'Email', kSupportEmail, 'mailto:$kSupportEmail'),
                          _supportRow(Icons.phone_rounded, 'Phone', kSupportPhone, 'tel:$kSupportPhone'),
                        ],
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Center(
                        child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 14)),
                      ),
                    ],
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 80, child: Text(label, style: TextStyle(color: Colors.grey.shade700, fontSize: 14))),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500))),
        ],
      ),
    );
  }

  Widget _supportRow(IconData icon, String label, String value, String url) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: () async {
          final uri = Uri.parse(url);
          if (await canLaunchUrl(uri)) {
            await launchUrl(uri);
          }
        },
        borderRadius: BorderRadius.circular(8),
        child: Row(
          children: [
            Icon(icon, size: 20, color: InvestmentTheme.kPrimary),
            const SizedBox(width: 12),
            SizedBox(width: 56, child: Text(label, style: TextStyle(color: Colors.grey.shade700, fontSize: 14))),
            Expanded(
              child: Text(
                value,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: InvestmentTheme.kPrimary),
              ),
            ),
            Icon(Icons.open_in_new_rounded, size: 16, color: Colors.grey.shade600),
          ],
        ),
      ),
    );
  }

  Widget _verificationChip() {
    Color bg;
    Color fg;
    String label;
    if (_isVerified) {
      bg = InvestmentTheme.kSuccess.withOpacity(0.15);
      fg = InvestmentTheme.kSuccess;
      label = 'Verified';
    } else if (_isPending) {
      bg = Colors.orange.withOpacity(0.15);
      fg = Colors.orange.shade800;
      label = 'Pending';
    } else if (_isRejected) {
      bg = Colors.red.withOpacity(0.15);
      fg = Colors.red.shade700;
      label = 'Not verified';
    } else {
      bg = Colors.grey.withOpacity(0.15);
      fg = Colors.grey.shade700;
      label = 'Not submitted';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg)),
    );
  }
}
