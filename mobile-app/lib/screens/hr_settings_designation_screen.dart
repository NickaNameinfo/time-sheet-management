import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';

class HrSettingsDesignationScreen extends StatefulWidget {
  const HrSettingsDesignationScreen({super.key});

  @override
  State<HrSettingsDesignationScreen> createState() => _HrSettingsDesignationScreenState();
}

class _HrSettingsDesignationScreenState extends State<HrSettingsDesignationScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;
  List<dynamic> _designations = [];

  @override
  void initState() {
    super.initState();
    _loadDesignations();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadDesignations() async {
    setState(() => _isLoading = true);
    try {
      final designations = await _apiService.getDesignations();
      setState(() {
        _designations = designations;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading designations: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _addDesignation() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a designation name')),
      );
      return;
    }

    try {
      await _apiService.createDesignation({'designation': _nameController.text.trim()});
      if (mounted) {
        _nameController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Designation added successfully'), backgroundColor: Colors.green),
        );
        _loadDesignations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _deleteDesignation(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Designation'),
        content: Text('Are you sure you want to delete "$name"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await _apiService.deleteDesignation(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Designation "$name" deleted successfully'), backgroundColor: Colors.green),
        );
        _loadDesignations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Designation Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDesignations,
          ),
        ],
      ),
      body: Column(
        children: [
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Add New Designation',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Designation Name',
                      border: OutlineInputBorder(),
                      hintText: 'e.g., Senior Engineer',
                    ),
                    onSubmitted: (_) => _addDesignation(),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _addDesignation,
                    icon: const Icon(Icons.add),
                    label: const Text('Add Designation'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _designations.isEmpty
                    ? const Center(child: Text('No designations found'))
                    : RefreshIndicator(
                        onRefresh: _loadDesignations,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _designations.length,
                          itemBuilder: (context, index) {
                            final designation = _designations[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.work, color: Colors.green),
                                title: Text(designation['designation']?.toString() ?? ''),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deleteDesignation(
                                    int.parse(designation['id']?.toString() ?? '0'),
                                    designation['designation']?.toString() ?? '',
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

