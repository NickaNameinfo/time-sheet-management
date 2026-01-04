import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class BudgetTrackingScreen extends StatefulWidget {
  const BudgetTrackingScreen({super.key});

  @override
  State<BudgetTrackingScreen> createState() => _BudgetTrackingScreenState();
}

class _BudgetTrackingScreenState extends State<BudgetTrackingScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _projects = [];
  Map<String, dynamic>? _selectedProject;
  List<dynamic> _budgets = [];
  List<dynamic> _costs = [];
  Map<String, dynamic>? _budgetVsActual;
  Map<String, dynamic>? _profitability;
  Map<String, dynamic>? _appSettings;

  @override
  void initState() {
    super.initState();
    _loadProjects();
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

  Future<void> _loadProjects() async {
    setState(() => _isLoading = true);
    try {
      final projects = await _apiService.getProjects();
      setState(() {
        _projects = projects;
        if (projects.isNotEmpty && _selectedProject == null) {
          _selectedProject = projects[0];
          _loadBudgetData();
        }
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading projects: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _loadBudgetData() async {
    if (_selectedProject == null) return;
    
    setState(() => _isLoading = true);
    try {
      final projectId = _selectedProject!['id']?.toString() ?? '';
      
      final budgets = await _apiService.getProjectBudget(projectId);
      final costs = await _apiService.getProjectCosts(projectId);
      final budgetVsActual = await _apiService.getBudgetVsActual(projectId);
      final profitability = await _apiService.getProfitabilityReport(projectId);
      
      setState(() {
        _budgets = budgets;
        _costs = costs;
        _budgetVsActual = budgetVsActual;
        _profitability = profitability;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading budget data: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _setBudget() async {
    if (_selectedProject == null) return;

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _SetBudgetDialog(
        currency: _appSettings?['currency'] ?? 'AED',
      ),
    );

    if (result != null) {
      try {
        await _apiService.setProjectBudget(
          _selectedProject!['id']?.toString() ?? '',
          {
            'budgetAmount': result['budgetAmount'],
            'budgetHours': result['budgetHours'],
            'currency': result['currency'],
          },
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Budget set successfully')),
          );
          _loadBudgetData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _trackCost() async {
    if (_selectedProject == null) return;

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _TrackCostDialog(),
    );

    if (result != null) {
      try {
        await _apiService.trackProjectCost(
          _selectedProject!['id']?.toString() ?? '',
          {
            'costDate': result['costDate'],
            'employeeCost': result['employeeCost'] ?? 0,
            'overheadCost': result['overheadCost'] ?? 0,
            'materialCost': result['materialCost'] ?? 0,
            'hoursSpent': result['hoursSpent'] ?? 0,
          },
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cost tracked successfully')),
          );
          _loadBudgetData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _editBudget(dynamic budget) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _SetBudgetDialog(
        currency: _appSettings?['currency'] ?? 'AED',
        initialBudget: budget,
      ),
    );

    if (result != null) {
      try {
        await _apiService.updateProjectBudget(
          budget['id'],
          {
            'budgetAmount': result['budgetAmount'],
            'budgetHours': result['budgetHours'],
            'currency': result['currency'],
          },
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Budget updated successfully')),
          );
          _loadBudgetData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _deleteBudget(dynamic budget) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Budget'),
        content: Text('Are you sure you want to delete this budget?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteProjectBudget(budget['id']);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Budget deleted successfully')),
          );
          _loadBudgetData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _editCost(dynamic cost) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _TrackCostDialog(initialCost: cost),
    );

    if (result != null) {
      try {
        await _apiService.updateProjectCost(
          cost['id'],
          {
            'costDate': result['costDate'],
            'employeeCost': result['employeeCost'] ?? 0,
            'overheadCost': result['overheadCost'] ?? 0,
            'materialCost': result['materialCost'] ?? 0,
            'hoursSpent': result['hoursSpent'] ?? 0,
          },
        );
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cost updated successfully')),
          );
          _loadBudgetData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  Future<void> _deleteCost(dynamic cost) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Cost'),
        content: Text('Are you sure you want to delete this cost entry?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteProjectCost(cost['id']);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Cost deleted successfully')),
          );
          _loadBudgetData();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Budget Tracking'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Overview'),
              Tab(text: 'Budgets'),
              Tab(text: 'Costs'),
              Tab(text: 'Reports'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadBudgetData,
            ),
          ],
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _selectedProject == null
                ? const Center(child: Text('Please select a project'))
                : Column(
                    children: [
                      // Project Selector
                      Card(
                        margin: const EdgeInsets.all(16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: DropdownButtonFormField<Map<String, dynamic>>(
                            value: _selectedProject,
                            decoration: const InputDecoration(
                              labelText: 'Select Project',
                              border: OutlineInputBorder(),
                            ),
                            items: _projects.map((p) {
                              return DropdownMenuItem<Map<String, dynamic>>(
                                value: p as Map<String, dynamic>,
                                child: Text(p['projectName']?.toString() ?? ''),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() => _selectedProject = value);
                              _loadBudgetData();
                            },
                          ),
                        ),
                      ),
                      // Tab Content
                      Expanded(
                        child: TabBarView(
                          children: [
                            _buildOverviewTab(),
                            _buildBudgetsTab(),
                            _buildCostsTab(),
                            _buildReportsTab(),
                          ],
                        ),
                      ),
                    ],
                  ),
        floatingActionButton: _selectedProject != null
            ? Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FloatingActionButton.extended(
                    onPressed: _setBudget,
                    icon: const Icon(Icons.account_balance),
                    label: const Text('Set Budget'),
                    backgroundColor: Colors.purple,
                  ),
                  const SizedBox(height: 8),
                  FloatingActionButton.extended(
                    onPressed: _trackCost,
                    icon: const Icon(Icons.add),
                    label: const Text('Track Cost'),
                  ),
                ],
              )
            : null,
      ),
    );
  }

  Widget _buildOverviewTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_budgetVsActual != null) _buildBudgetVsActualCard(),
          const SizedBox(height: 16),
          if (_profitability != null) _buildProfitabilityCard(),
        ],
      ),
    );
  }

  Widget _buildBudgetVsActualCard() {
    final budget = _budgetVsActual!['budget'] ?? {};
    final actual = _budgetVsActual!['actual'] ?? {};
    final variance = _budgetVsActual!['variance'] ?? {};
    final currency = _appSettings?['currency'] ?? 'AED';
    final currencySymbol = _appSettings?['currency_symbol'] ?? '';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Budget vs Actual',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow('Budget Amount', '$currencySymbol${budget['amount'] ?? 0} $currency'),
            _buildMetricRow('Actual Cost', '$currencySymbol${actual['cost'] ?? 0} $currency'),
            _buildMetricRow('Variance', '$currencySymbol${variance['amount'] ?? 0} $currency'),
            _buildMetricRow('Budget Hours', '${budget['hours'] ?? 0} hrs'),
            _buildMetricRow('Actual Hours', '${actual['hours'] ?? 0} hrs'),
            _buildMetricRow('Hours Variance', '${variance['hours'] ?? 0} hrs'),
          ],
        ),
      ),
    );
  }

  Widget _buildProfitabilityCard() {
    final profit = _profitability!;
    final currency = _appSettings?['currency'] ?? 'AED';
    final currencySymbol = _appSettings?['currency_symbol'] ?? '';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Profitability',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _buildMetricRow('Revenue', '$currencySymbol${profit['revenue'] ?? 0} $currency'),
            _buildMetricRow('Cost', '$currencySymbol${profit['cost'] ?? 0} $currency'),
            _buildMetricRow('Profit', '$currencySymbol${profit['profit'] ?? 0} $currency'),
            _buildMetricRow('Margin', '${profit['margin'] ?? 0}%'),
            _buildMetricRow('ROI', '${profit['roi'] ?? 0}%'),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildBudgetsTab() {
    return _budgets.isEmpty
        ? const Center(child: Text('No budgets found'))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _budgets.length,
            itemBuilder: (context, index) {
              final budget = _budgets[index];
              final currency = budget['currency'] ?? _appSettings?['currency'] ?? 'AED';
              final currencySymbol = _appSettings?['currency_symbol'] ?? '';

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text('${currencySymbol}${budget['budget_amount'] ?? 0} $currency'),
                  subtitle: Text('${budget['budget_hours'] ?? 0} hours'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _editBudget(budget),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _deleteBudget(budget),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
  }

  Widget _buildCostsTab() {
    return _costs.isEmpty
        ? const Center(child: Text('No costs found'))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _costs.length,
            itemBuilder: (context, index) {
              final cost = _costs[index];
              final currency = _appSettings?['currency'] ?? 'AED';
              final currencySymbol = _appSettings?['currency_symbol'] ?? '';

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  title: Text(DateFormat('yyyy-MM-dd').format(
                    DateTime.tryParse(cost['cost_date']?.toString() ?? '') ?? DateTime.now(),
                  )),
                  subtitle: Text(
                    'Total: $currencySymbol${cost['total_cost'] ?? 0} $currency\n'
                    'Hours: ${cost['hours_spent'] ?? 0}',
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.edit, color: Colors.blue),
                        onPressed: () => _editCost(cost),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _deleteCost(cost),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
  }

  Widget _buildReportsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          if (_budgetVsActual != null) _buildBudgetVsActualCard(),
          const SizedBox(height: 16),
          if (_profitability != null) _buildProfitabilityCard(),
        ],
      ),
    );
  }
}

class _SetBudgetDialog extends StatefulWidget {
  final String currency;
  final dynamic initialBudget;

  const _SetBudgetDialog({
    required this.currency,
    this.initialBudget,
  });

  @override
  State<_SetBudgetDialog> createState() => _SetBudgetDialogState();
}

class _SetBudgetDialogState extends State<_SetBudgetDialog> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _hoursController = TextEditingController();
  String _selectedCurrency = 'AED';

  @override
  void initState() {
    super.initState();
    _selectedCurrency = widget.currency;
    if (widget.initialBudget != null) {
      _amountController.text = widget.initialBudget['budget_amount']?.toString() ?? '';
      _hoursController.text = widget.initialBudget['budget_hours']?.toString() ?? '';
      _selectedCurrency = widget.initialBudget['currency']?.toString() ?? widget.currency;
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _hoursController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initialBudget == null ? 'Set Budget' : 'Edit Budget'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Budget Amount *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Required';
                  if (double.tryParse(value) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _hoursController,
                decoration: const InputDecoration(
                  labelText: 'Budget Hours *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Required';
                  if (double.tryParse(value) == null) return 'Invalid number';
                  return null;
                },
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
            if (_formKey.currentState!.validate()) {
              Navigator.pop(context, {
                'budgetAmount': double.parse(_amountController.text),
                'budgetHours': double.parse(_hoursController.text),
                'currency': _selectedCurrency,
              });
            }
          },
          child: Text(widget.initialBudget == null ? 'Set' : 'Update'),
        ),
      ],
    );
  }
}

class _TrackCostDialog extends StatefulWidget {
  final dynamic initialCost;

  const _TrackCostDialog({this.initialCost});

  @override
  State<_TrackCostDialog> createState() => _TrackCostDialogState();
}

class _TrackCostDialogState extends State<_TrackCostDialog> {
  final _formKey = GlobalKey<FormState>();
  DateTime _selectedDate = DateTime.now();
  final _employeeCostController = TextEditingController();
  final _overheadCostController = TextEditingController();
  final _materialCostController = TextEditingController();
  final _hoursController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.initialCost != null) {
      final costDate = widget.initialCost['cost_date']?.toString();
      if (costDate != null) {
        _selectedDate = DateTime.tryParse(costDate) ?? DateTime.now();
      }
      _employeeCostController.text = widget.initialCost['employee_cost']?.toString() ?? '';
      _overheadCostController.text = widget.initialCost['overhead_cost']?.toString() ?? '';
      _materialCostController.text = widget.initialCost['material_cost']?.toString() ?? '';
      _hoursController.text = widget.initialCost['hours_spent']?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _employeeCostController.dispose();
    _overheadCostController.dispose();
    _materialCostController.dispose();
    _hoursController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.initialCost == null ? 'Track Cost' : 'Edit Cost'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Cost Date *'),
                subtitle: Text(DateFormat('yyyy-MM-dd').format(_selectedDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: _selectDate,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _employeeCostController,
                decoration: const InputDecoration(
                  labelText: 'Employee Cost',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _overheadCostController,
                decoration: const InputDecoration(
                  labelText: 'Overhead Cost',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _materialCostController,
                decoration: const InputDecoration(
                  labelText: 'Material Cost',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _hoursController,
                decoration: const InputDecoration(
                  labelText: 'Hours Spent',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
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
            if (_formKey.currentState!.validate()) {
              Navigator.pop(context, {
                'costDate': DateFormat('yyyy-MM-dd').format(_selectedDate),
                'employeeCost': _employeeCostController.text.isNotEmpty
                    ? double.tryParse(_employeeCostController.text)
                    : 0,
                'overheadCost': _overheadCostController.text.isNotEmpty
                    ? double.tryParse(_overheadCostController.text)
                    : 0,
                'materialCost': _materialCostController.text.isNotEmpty
                    ? double.tryParse(_materialCostController.text)
                    : 0,
                'hoursSpent': _hoursController.text.isNotEmpty
                    ? double.tryParse(_hoursController.text)
                    : 0,
              });
            }
          },
          child: Text(widget.initialCost == null ? 'Track' : 'Update'),
        ),
      ],
    );
  }
}

