import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';

class KycFormScreen extends StatefulWidget {
  const KycFormScreen({super.key});

  @override
  State<KycFormScreen> createState() => _KycFormScreenState();
}

class _KycFormScreenState extends State<KycFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api = InvestmentApiService();
  bool _loading = false;
  bool _loadingData = true;
  String? _error;

  final _bankHolder = TextEditingController();
  final _bankName = TextEditingController();
  final _accountNumber = TextEditingController();
  final _ifsc = TextEditingController();
  final _branch = TextEditingController();
  final _address = TextEditingController();
  final _aadhaar = TextEditingController();
  final _pan = TextEditingController();

  // Masked values from API (show/hide with eye)
  String? _accountMasked;
  String? _aadhaarMasked;
  String? _panMasked;
  bool _showAccount = true;
  bool _showAadhaar = true;
  bool _showPan = true;

  // Document uploads (Aadhaar & PAN card) – XFile is cross-platform (no dart:io)
  XFile? _aadhaarDocument;
  XFile? _panDocument;
  bool _hasAadhaarDocument = false;
  bool _hasPanDocument = false;

  /// When VERIFIED, user can only upload/update documents via documents endpoint.
  String? _kycStatus;
  String? _documentVerificationStatus;

  @override
  void initState() {
    super.initState();
    _loadExistingKyc();
  }

  Future<void> _loadExistingKyc() async {
    try {
      final data = await _api.getKycStatus();
      if (!mounted) return;
      final status = data['status']?.toString();
      final docStatus = data['document_verification_status']?.toString();
      if (mounted) setState(() {
        _kycStatus = status;
        _documentVerificationStatus = docStatus;
      });
      final kyc = data['kyc'] as Map<String, dynamic>?;
      if (kyc != null) {
        if (kyc['bank_holder_name'] != null) _bankHolder.text = kyc['bank_holder_name'].toString();
        if (kyc['bank_name'] != null) _bankName.text = kyc['bank_name'].toString();
        if (kyc['ifsc_code'] != null) _ifsc.text = kyc['ifsc_code'].toString();
        if (kyc['branch'] != null) _branch.text = kyc['branch'].toString();
        if (kyc['address'] != null) _address.text = kyc['address'].toString();
        final accountMasked = kyc['account_number_masked']?.toString();
        final aadhaarMasked = kyc['aadhaar_masked']?.toString();
        final panMasked = kyc['pan_masked']?.toString();
        if (accountMasked != null && accountMasked.isNotEmpty) {
          _accountMasked = accountMasked;
          _accountNumber.text = '';
        }
        if (aadhaarMasked != null && aadhaarMasked.isNotEmpty) {
          _aadhaarMasked = aadhaarMasked;
          _aadhaar.text = '';
        }
        if (panMasked != null && panMasked.isNotEmpty) {
          _panMasked = panMasked;
          _pan.text = '';
        }
        final hasAadhaar = kyc['has_aadhaar_document'] == true;
        final hasPan = kyc['has_pan_document'] == true;
        if (mounted) setState(() {
          _hasAadhaarDocument = hasAadhaar;
          _hasPanDocument = hasPan;
        });
      }
    } catch (_) {
      // No existing KYC or error - leave form empty
    } finally {
      if (mounted) setState(() => _loadingData = false);
    }
  }

  @override
  void dispose() {
    _bankHolder.dispose();
    _bankName.dispose();
    _accountNumber.dispose();
    _ifsc.dispose();
    _branch.dispose();
    _address.dispose();
    _aadhaar.dispose();
    _pan.dispose();
    super.dispose();
  }

  bool get _allDetailsVerified =>
      _kycStatus == 'VERIFIED' && _documentVerificationStatus == 'VERIFIED';

  Widget _buildDocumentSection() {
    final disableDocumentActions = _allDetailsVerified;
    return Container(
      padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
      decoration: InvestmentTheme.cardDecoration(color: InvestmentTheme.kInfo.withOpacity(0.06)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.folder_open_rounded, color: InvestmentTheme.kInfo, size: 22),
              const SizedBox(width: 8),
              Text('Documents', style: InvestmentTheme.sectionTitle(context)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            disableDocumentActions
                ? 'Aadhaar and PAN documents are verified. No changes needed.'
                : 'Upload Aadhaar and PAN card (image or PDF). Optional but helps verification.',
            style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
          ),
          const SizedBox(height: 16),
          _buildDocumentTile(
            label: 'Aadhaar card',
            icon: Icons.badge_outlined,
            file: _aadhaarDocument,
            isUploaded: _hasAadhaarDocument && _aadhaarDocument == null,
            allowChange: !disableDocumentActions,
            onPick: () => _pickDocument(isAadhaar: true),
            onClear: () => setState(() {
              _aadhaarDocument = null;
            }),
          ),
          const SizedBox(height: 12),
          _buildDocumentTile(
            label: 'PAN card',
            icon: Icons.credit_card_outlined,
            file: _panDocument,
            isUploaded: _hasPanDocument && _panDocument == null,
            allowChange: !disableDocumentActions,
            onPick: () => _pickDocument(isAadhaar: false),
            onClear: () => setState(() {
              _panDocument = null;
            }),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDocument({required bool isAadhaar}) async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_rounded),
              title: const Text('Gallery'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_rounded),
              title: const Text('Camera'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
          ],
        ),
      ),
    );
    if (source == null || !mounted) return;
    final picked = await picker.pickImage(source: source, imageQuality: 85);
    if (picked == null || !mounted) return;
    setState(() {
      if (isAadhaar) {
        _aadhaarDocument = picked;
      } else {
        _panDocument = picked;
      }
    });
  }

  Widget _buildDocumentTile({
    required String label,
    required IconData icon,
    required XFile? file,
    required bool isUploaded,
    bool allowChange = true,
    required VoidCallback onPick,
    required VoidCallback onClear,
  }) {
    final hasFile = file != null || isUploaded;
    final displayName = file != null ? (file.name.isNotEmpty ? file.name : 'Image') : null;
    final subtitle = hasFile
        ? (isUploaded && file == null ? 'Already uploaded' : (displayName ?? 'Uploaded'))
        : 'Not uploaded';
    final subtitleColor = isUploaded && file == null
        ? Colors.green.shade700
        : Colors.grey.shade600;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        children: [
          Icon(icon, color: InvestmentTheme.kInfo, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                Row(
                  children: [
                    if (isUploaded && file == null) ...[
                      Icon(Icons.check_circle_rounded, size: 16, color: Colors.green.shade700),
                      const SizedBox(width: 4),
                    ],
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 12, color: subtitleColor, fontWeight: isUploaded && file == null ? FontWeight.w500 : null),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (file != null && allowChange)
            IconButton(
              icon: const Icon(Icons.close, size: 20),
              onPressed: onClear,
              tooltip: 'Remove',
            ),
          if (allowChange)
            FilledButton.icon(
              onPressed: onPick,
              icon: Icon(hasFile ? Icons.refresh : Icons.upload_file_rounded, size: 18),
              label: Text(hasFile ? 'Change' : 'Upload'),
              style: FilledButton.styleFrom(minimumSize: const Size(0, 40)),
            )
          else if (hasFile)
            Icon(Icons.verified_rounded, color: Colors.green.shade700, size: 28),
        ],
      ),
    );
  }

  Widget _buildMaskedRow(String label, String maskedValue, bool show, VoidCallback onToggle) {
    final display = show ? maskedValue : '••••••••';
    return Semantics(
      label: '$label: ${show ? "visible" : "hidden"}',
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: Row(
          children: [
            Text(label, style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
            const SizedBox(width: 8),
            Expanded(
              child: Text(display, style: const TextStyle(fontFamily: 'monospace', fontSize: 14)),
            ),
            IconButton(
              icon: Icon(show ? Icons.visibility_off : Icons.visibility, size: 24, color: Colors.grey.shade700),
              onPressed: onToggle,
              tooltip: show ? 'Hide' : 'Show',
              style: IconButton.styleFrom(minimumSize: const Size(InvestmentTheme.kMinTouchTarget, InvestmentTheme.kMinTouchTarget)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final isVerifiedOnlyUpload = _kycStatus == 'VERIFIED';
    if (isVerifiedOnlyUpload) {
      if (_aadhaarDocument == null && _panDocument == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Select at least one document (Aadhaar or PAN) to upload.')),
        );
        return;
      }
      setState(() {
        _loading = true;
        _error = null;
      });
      try {
        List<int>? aadhaarBytes = _aadhaarDocument != null ? await _aadhaarDocument!.readAsBytes() : null;
        List<int>? panBytes = _panDocument != null ? await _panDocument!.readAsBytes() : null;
        await _api.uploadKycDocuments(aadhaarFileBytes: aadhaarBytes, panFileBytes: panBytes);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Documents uploaded. Admin will verify.')),
        );
        _loadExistingKyc();
        setState(() => _loading = false);
      } catch (e) {
        if (mounted) setState(() {
          _error = e.toString().replaceFirst('Exception: ', '');
          _loading = false;
        });
      }
      return;
    }
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      List<int>? aadhaarBytes;
      List<int>? panBytes;
      if (_aadhaarDocument != null) {
        aadhaarBytes = await _aadhaarDocument!.readAsBytes();
      }
      if (_panDocument != null) {
        panBytes = await _panDocument!.readAsBytes();
      }
      await _api.submitKyc(
        bankHolderName: _bankHolder.text.trim(),
        bankName: _bankName.text.trim(),
        accountNumber: _accountNumber.text.trim(),
        ifscCode: _ifsc.text.trim().toUpperCase(),
        branch: _branch.text.trim(),
        address: _address.text.trim(),
        aadhaarNumber: _aadhaar.text.trim().replaceAll(' ', ''),
        panNumber: _pan.text.trim().toUpperCase(),
        aadhaarFileBytes: aadhaarBytes,
        panFileBytes: panBytes,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('KYC submitted. Verification within 24 hours.')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingData) {
      return Scaffold(
        backgroundColor: InvestmentTheme.kBackground,
        appBar: InvestmentTheme.appBar('KYC / Profile Verification'),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      backgroundColor: InvestmentTheme.kBackground,
      appBar: InvestmentTheme.appBar('KYC / Profile Verification'),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(InvestmentTheme.kCardPadding),
          children: [
            Semantics(
              label: 'Bank and identity details are required to invest. Aadhaar and PAN will be verified within 24 hours.',
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: InvestmentTheme.cardDecoration(color: InvestmentTheme.kInfo.withOpacity(0.08)),
                child: Text(
                  'Bank & identity details are required to invest. Aadhaar & PAN will be verified within 24 hours.',
                  style: TextStyle(color: Colors.grey.shade800, fontSize: 14),
                ),
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _bankHolder,
              decoration: const InputDecoration(
                labelText: 'Bank Account Holder Name *',
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.words,
              validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _bankName,
              decoration: const InputDecoration(labelText: 'Bank Name *', border: OutlineInputBorder()),
              validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            if (_accountMasked != null) _buildMaskedRow('Current account', _accountMasked!, _showAccount, () => setState(() => _showAccount = !_showAccount)),
            if (_accountMasked != null) const SizedBox(height: 8),
            TextFormField(
              controller: _accountNumber,
              decoration: InputDecoration(
                labelText: _accountMasked != null ? 'Account Number (re-enter to update)' : 'Account Number *',
                border: const OutlineInputBorder(),
                hintText: _accountMasked != null ? 'Leave blank to keep current' : null,
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              validator: (v) {
                if (_accountMasked != null && (v?.trim().isEmpty ?? true)) return null;
                return v?.trim().isEmpty ?? true ? 'Required' : null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _ifsc,
              decoration: const InputDecoration(labelText: 'IFSC Code *', border: OutlineInputBorder()),
              textCapitalization: TextCapitalization.characters,
              maxLength: 11,
              validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _branch,
              decoration: const InputDecoration(labelText: 'Branch *', border: OutlineInputBorder()),
              validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _address,
              decoration: const InputDecoration(labelText: 'Address *', border: OutlineInputBorder()),
              maxLines: 2,
              validator: (v) => v?.trim().isEmpty ?? true ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            if (_aadhaarMasked != null) _buildMaskedRow('Current Aadhaar', _aadhaarMasked!, _showAadhaar, () => setState(() => _showAadhaar = !_showAadhaar)),
            if (_aadhaarMasked != null) const SizedBox(height: 8),
            TextFormField(
              controller: _aadhaar,
              decoration: InputDecoration(
                labelText: _aadhaarMasked != null ? 'Aadhaar Number (re-enter to update)' : 'Aadhaar Number *',
                border: const OutlineInputBorder(),
                hintText: _aadhaarMasked != null ? 'Leave blank to keep current' : '12 digits',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(12)],
              validator: (v) {
                final s = v?.trim().replaceAll(' ', '') ?? '';
                if (s.isEmpty) {
                  if (_aadhaarMasked != null) return null;
                  return 'Required';
                }
                if (s.length != 12) return 'Must be 12 digits';
                return null;
              },
            ),
            const SizedBox(height: 16),
            if (_panMasked != null) _buildMaskedRow('Current PAN', _panMasked!, _showPan, () => setState(() => _showPan = !_showPan)),
            if (_panMasked != null) const SizedBox(height: 8),
            TextFormField(
              controller: _pan,
              decoration: InputDecoration(
                labelText: _panMasked != null ? 'PAN Number (re-enter to update)' : 'PAN Number *',
                border: const OutlineInputBorder(),
                hintText: _panMasked != null ? 'Leave blank to keep current' : 'e.g. ABCDE1234F',
              ),
              textCapitalization: TextCapitalization.characters,
              maxLength: 10,
              validator: (v) {
                final s = v?.trim().toUpperCase() ?? '';
                if (s.isEmpty) {
                  if (_panMasked != null) return null;
                  return 'Required';
                }
                if (s.length != 10) return 'Must be 10 characters';
                return null;
              },
            ),
            const SizedBox(height: 24),
            if (_kycStatus == 'VERIFIED') ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: InvestmentTheme.cardDecoration(color: Colors.green.shade50),
                child: Row(
                  children: [
                    Icon(Icons.check_circle_rounded, color: Colors.green.shade700, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _documentVerificationStatus == 'VERIFIED'
                            ? 'Profile and documents are verified. No further action needed.'
                            : 'Profile verified. You can upload or update Aadhaar/PAN documents below. Document verification: ${_documentVerificationStatus ?? 'PENDING'}.',
                        style: TextStyle(fontSize: 13, color: Colors.grey.shade800),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            _buildDocumentSection(),
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
            Builder(
              builder: (context) {
                final allDetailsVerified = _allDetailsVerified;
                return FilledButton(
                  onPressed: (allDetailsVerified || _loading) ? null : _submit,
                  style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                  child: _loading
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(
                          allDetailsVerified
                              ? 'All details verified'
                              : _kycStatus == 'VERIFIED'
                                  ? 'Upload documents'
                                  : 'Submit KYC',
                        ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
