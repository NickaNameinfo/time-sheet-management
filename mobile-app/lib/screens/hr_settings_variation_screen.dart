import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';

class HrSettingsVariationScreen extends StatefulWidget {
  const HrSettingsVariationScreen({super.key});

  @override
  State<HrSettingsVariationScreen> createState() => _HrSettingsVariationScreenState();
}

class _HrSettingsVariationScreenState extends State<HrSettingsVariationScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;
  List<dynamic> _variations = [];

  @override
  void initState() {
    super.initState();
    _loadVariations();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadVariations() async {
    setState(() => _isLoading = true);
    try {
      final variations = await _apiService.getVariations();
      setState(() {
        _variations = variations;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading variations: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _addVariation() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a variation name')),
      );
      return;
    }

    try {
      await _apiService.createVariation({'variation': _nameController.text.trim()});
      if (mounted) {
        _nameController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Variation added successfully'), backgroundColor: Colors.green),
        );
        _loadVariations();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _deleteVariation(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Variation'),
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
      await _apiService.deleteVariation(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Variation "$name" deleted successfully'), backgroundColor: Colors.green),
        );
        _loadVariations();
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
        title: const Text('Variation Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadVariations,
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
                    'Add New Variation',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Variation Name',
                      border: OutlineInputBorder(),
                      hintText: 'e.g., Original',
                    ),
                    onSubmitted: (_) => _addVariation(),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _addVariation,
                    icon: const Icon(Icons.add),
                    label: const Text('Add Variation'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple,
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
                : _variations.isEmpty
                    ? const Center(child: Text('No variations found'))
                    : RefreshIndicator(
                        onRefresh: _loadVariations,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _variations.length,
                          itemBuilder: (context, index) {
                            final variation = _variations[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.change_circle, color: Colors.purple),
                                title: Text(variation['variation']?.toString() ?? ''),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deleteVariation(
                                    int.parse(variation['id']?.toString() ?? '0'),
                                    variation['variation']?.toString() ?? '',
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

