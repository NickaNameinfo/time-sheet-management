import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';

class HrSettingsDisciplineScreen extends StatefulWidget {
  const HrSettingsDisciplineScreen({super.key});

  @override
  State<HrSettingsDisciplineScreen> createState() => _HrSettingsDisciplineScreenState();
}

class _HrSettingsDisciplineScreenState extends State<HrSettingsDisciplineScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;
  List<dynamic> _disciplines = [];

  @override
  void initState() {
    super.initState();
    _loadDisciplines();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadDisciplines() async {
    setState(() => _isLoading = true);
    try {
      final disciplines = await _apiService.getDisciplines();
      setState(() {
        _disciplines = disciplines;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading disciplines: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _addDiscipline() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a discipline name')),
      );
      return;
    }

    try {
      await _apiService.createDiscipline({'discipline': _nameController.text.trim()});
      if (mounted) {
        _nameController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Discipline added successfully'), backgroundColor: Colors.green),
        );
        _loadDisciplines();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _deleteDiscipline(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Discipline'),
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
      await _apiService.deleteDiscipline(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Discipline "$name" deleted successfully'), backgroundColor: Colors.green),
        );
        _loadDisciplines();
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
        title: const Text('Discipline Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDisciplines,
          ),
        ],
      ),
      body: Column(
        children: [
          // Add Discipline Card
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Add New Discipline',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Discipline Name',
                      border: OutlineInputBorder(),
                      hintText: 'e.g., Civil Engineering',
                    ),
                    onSubmitted: (_) => _addDiscipline(),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _addDiscipline,
                    icon: const Icon(Icons.add),
                    label: const Text('Add Discipline'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Disciplines List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _disciplines.isEmpty
                    ? const Center(child: Text('No disciplines found'))
                    : RefreshIndicator(
                        onRefresh: _loadDisciplines,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _disciplines.length,
                          itemBuilder: (context, index) {
                            final discipline = _disciplines[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.school, color: Colors.blue),
                                title: Text(discipline['discipline']?.toString() ?? ''),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deleteDiscipline(
                                    int.parse(discipline['id']?.toString() ?? '0'),
                                    discipline['discipline']?.toString() ?? '',
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

