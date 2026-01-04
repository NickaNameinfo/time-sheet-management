import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class BillingManagementScreen extends StatefulWidget {
  const BillingManagementScreen({super.key});

  @override
  State<BillingManagementScreen> createState() => _BillingManagementScreenState();
}

class _BillingManagementScreenState extends State<BillingManagementScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _invoices = [];
  List<dynamic> _clients = [];
  Map<String, dynamic>? _appSettings;

  @override
  void initState() {
    super.initState();
    _loadData();
    _loadAppSettings();
  }

  Future<void> _loadAppSettings() async {
    try {
      final settings = await _apiService.getAppSettings();
      setState(() => _appSettings = settings);
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final invoices = await _apiService.getInvoices();
      final clients = await _apiService.getClients();
      setState(() {
        _invoices = invoices;
        _clients = clients;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _viewInvoice(dynamic invoice) async {
    try {
      final invoiceDetails = await _apiService.getInvoiceDetails(invoice['id']);
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => _ViewInvoiceDialog(
            invoice: invoiceDetails,
            currencySymbol: _appSettings?['currency_symbol'] ?? '',
            currency: _appSettings?['currency'] ?? 'AED',
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading invoice: $e')),
        );
      }
    }
  }

  Future<void> _editInvoice(dynamic invoice) async {
    try {
      final invoiceDetails = await _apiService.getInvoiceDetails(invoice['id']);
      final result = await showDialog<Map<String, dynamic>>(
        context: context,
        builder: (context) => _EditInvoiceDialog(
          invoice: invoiceDetails,
          currency: _appSettings?['currency'] ?? 'AED',
        ),
      );

      if (result != null) {
        await _apiService.updateInvoice(invoice['id'], result);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invoice updated successfully')),
          );
          _loadData();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Billing Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _invoices.isEmpty
              ? const Center(child: Text('No invoices found'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _invoices.length,
                  itemBuilder: (context, index) {
                    final invoice = _invoices[index];
                    final currency = invoice['currency'] ?? _appSettings?['currency'] ?? 'AED';
                    final currencySymbol = _appSettings?['currency_symbol'] ?? '';

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        title: Text(invoice['invoice_number']?.toString() ?? 'N/A'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Client: ${invoice['client_name'] ?? 'N/A'}'),
                            Text('Total: $currencySymbol${invoice['total_amount'] ?? 0} $currency'),
                            Text('Status: ${invoice['status'] ?? 'N/A'}'),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.visibility, color: Colors.blue),
                              onPressed: () => _viewInvoice(invoice),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.green),
                              onPressed: () => _editInvoice(invoice),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class _ViewInvoiceDialog extends StatelessWidget {
  final Map<String, dynamic> invoice;
  final String currencySymbol;
  final String currency;

  const _ViewInvoiceDialog({
    required this.invoice,
    required this.currencySymbol,
    required this.currency,
  });

  @override
  Widget build(BuildContext context) {
    final items = invoice['items'] as List<dynamic>? ?? [];

    return Dialog(
      child: Container(
        width: double.maxFinite,
        padding: const EdgeInsets.all(16),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Invoice Details',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              _buildInfoRow('Invoice Number', invoice['invoice_number']?.toString() ?? 'N/A'),
              _buildInfoRow('Client', invoice['client_name']?.toString() ?? 'N/A'),
              _buildInfoRow('Project', invoice['projectName']?.toString() ?? 'N/A'),
              _buildInfoRow('Date', _formatDate(invoice['invoice_date']?.toString())),
              _buildInfoRow('Due Date', _formatDate(invoice['due_date']?.toString())),
              const SizedBox(height: 16),
              const Text(
                'Items',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              ...items.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text(item['description']?.toString() ?? '')),
                        Text('${item['hours'] ?? 0} hrs × $currencySymbol${item['rate'] ?? 0} = $currencySymbol${item['amount'] ?? 0}'),
                      ],
                    ),
                  )),
              const Divider(),
              _buildInfoRow('Subtotal', '$currencySymbol${invoice['subtotal'] ?? 0} $currency'),
              _buildInfoRow('Tax (${invoice['tax_rate'] ?? 0}%)', '$currencySymbol${invoice['tax_amount'] ?? 0} $currency'),
              _buildInfoRow(
                'Total',
                '$currencySymbol${invoice['total_amount'] ?? 0} $currency',
                isBold: true,
              ),
              if (invoice['notes'] != null) ...[
                const SizedBox(height: 16),
                const Text(
                  'Notes',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(invoice['notes']?.toString() ?? ''),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: TextStyle(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        ],
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'N/A';
    try {
      final date = DateTime.tryParse(dateStr);
      if (date == null) return dateStr;
      return DateFormat('yyyy-MM-dd').format(date);
    } catch (e) {
      return dateStr;
    }
  }
}

class _EditInvoiceDialog extends StatefulWidget {
  final Map<String, dynamic> invoice;
  final String currency;

  const _EditInvoiceDialog({
    required this.invoice,
    required this.currency,
  });

  @override
  State<_EditInvoiceDialog> createState() => _EditInvoiceDialogState();
}

class _EditInvoiceDialogState extends State<_EditInvoiceDialog> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _invoiceDate;
  DateTime? _dueDate;
  final _subtotalController = TextEditingController();
  final _taxRateController = TextEditingController();
  final _notesController = TextEditingController();
  String _selectedCurrency = 'AED';
  String _selectedStatus = 'draft';

  @override
  void initState() {
    super.initState();
    _selectedCurrency = widget.invoice['currency']?.toString() ?? widget.currency;
    _selectedStatus = widget.invoice['status']?.toString() ?? 'draft';
    
    final invoiceDateStr = widget.invoice['invoice_date']?.toString();
    if (invoiceDateStr != null) {
      _invoiceDate = DateTime.tryParse(invoiceDateStr);
    }
    
    final dueDateStr = widget.invoice['due_date']?.toString();
    if (dueDateStr != null) {
      _dueDate = DateTime.tryParse(dueDateStr);
    }
    
    _subtotalController.text = widget.invoice['subtotal']?.toString() ?? '';
    _taxRateController.text = widget.invoice['tax_rate']?.toString() ?? '5';
    _notesController.text = widget.invoice['notes']?.toString() ?? '';
  }

  @override
  void dispose() {
    _subtotalController.dispose();
    _taxRateController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  double get _calculatedTax {
    final subtotal = double.tryParse(_subtotalController.text) ?? 0;
    final taxRate = double.tryParse(_taxRateController.text) ?? 0;
    return subtotal * (taxRate / 100);
  }

  double get _calculatedTotal {
    final subtotal = double.tryParse(_subtotalController.text) ?? 0;
    return subtotal + _calculatedTax;
  }

  Future<void> _selectInvoiceDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _invoiceDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() => _invoiceDate = picked);
    }
  }

  Future<void> _selectDueDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() => _dueDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Edit Invoice'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Invoice Date *'),
                subtitle: Text(_invoiceDate != null
                    ? DateFormat('yyyy-MM-dd').format(_invoiceDate!)
                    : 'Select date'),
                trailing: const Icon(Icons.calendar_today),
                onTap: _selectInvoiceDate,
              ),
              ListTile(
                title: const Text('Due Date *'),
                subtitle: Text(_dueDate != null
                    ? DateFormat('yyyy-MM-dd').format(_dueDate!)
                    : 'Select date'),
                trailing: const Icon(Icons.calendar_today),
                onTap: _selectDueDate,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _subtotalController,
                decoration: const InputDecoration(
                  labelText: 'Subtotal *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Required';
                  if (double.tryParse(value) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _taxRateController,
                decoration: const InputDecoration(
                  labelText: 'Tax Rate (%) *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                onChanged: (_) => setState(() {}),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Required';
                  if (double.tryParse(value) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              Text('Tax Amount: ${_calculatedTax.toStringAsFixed(2)}'),
              Text(
                'Total: ${_calculatedTotal.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedCurrency,
                decoration: const InputDecoration(
                  labelText: 'Currency',
                  border: OutlineInputBorder(),
                ),
                items: ['AED', 'INR', 'USD', 'GBP', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR']
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _selectedCurrency = value);
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedStatus,
                decoration: const InputDecoration(
                  labelText: 'Status',
                  border: OutlineInputBorder(),
                ),
                items: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
                    .map((s) => DropdownMenuItem(value: s, child: Text(s.toUpperCase())))
                    .toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _selectedStatus = value);
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                decoration: const InputDecoration(
                  labelText: 'Notes',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: () {
            if (_formKey.currentState!.validate() && _invoiceDate != null && _dueDate != null) {
              Navigator.pop(context, {
                'invoice_date': DateFormat('yyyy-MM-dd').format(_invoiceDate!),
                'due_date': DateFormat('yyyy-MM-dd').format(_dueDate!),
                'subtotal': double.parse(_subtotalController.text),
                'tax_rate': double.parse(_taxRateController.text),
                'tax_amount': _calculatedTax,
                'total_amount': _calculatedTotal,
                'currency': _selectedCurrency,
                'status': _selectedStatus,
                'notes': _notesController.text,
              });
            }
          },
          child: const Text('Update'),
        ),
      ],
    );
  }
}

