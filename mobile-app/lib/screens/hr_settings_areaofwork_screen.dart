import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';

class HrSettingsAreaOfWorkScreen extends StatefulWidget {
  const HrSettingsAreaOfWorkScreen({super.key});

  @override
  State<HrSettingsAreaOfWorkScreen> createState() => _HrSettingsAreaOfWorkScreenState();
}

class _HrSettingsAreaOfWorkScreenState extends State<HrSettingsAreaOfWorkScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _nameController = TextEditingController();
  bool _isLoading = false;
  List<dynamic> _areaOfWork = [];

  @override
  void initState() {
    super.initState();
    _loadAreaOfWork();
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadAreaOfWork() async {
    setState(() => _isLoading = true);
    try {
      final areaOfWork = await _apiService.getAreaOfWork();
      setState(() {
        _areaOfWork = areaOfWork;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading area of work: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _addAreaOfWork() async {
    if (_nameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an area of work name')),
      );
      return;
    }

    try {
      await _apiService.createAreaOfWork({'areaofwork': _nameController.text.trim()});
      if (mounted) {
        _nameController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Area of work added successfully'), backgroundColor: Colors.green),
        );
        _loadAreaOfWork();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _deleteAreaOfWork(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Area of Work'),
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
      await _apiService.deleteAreaOfWork(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Area of work "$name" deleted successfully'), backgroundColor: Colors.green),
        );
        _loadAreaOfWork();
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
        title: const Text('Area of Work Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAreaOfWork,
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
                    'Add New Area of Work',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Area of Work Name',
                      border: OutlineInputBorder(),
                      hintText: 'e.g., Design',
                    ),
                    onSubmitted: (_) => _addAreaOfWork(),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _addAreaOfWork,
                    icon: const Icon(Icons.add),
                    label: const Text('Add Area of Work'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange,
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
                : _areaOfWork.isEmpty
                    ? const Center(child: Text('No areas of work found'))
                    : RefreshIndicator(
                        onRefresh: _loadAreaOfWork,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _areaOfWork.length,
                          itemBuilder: (context, index) {
                            final area = _areaOfWork[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.engineering, color: Colors.orange),
                                title: Text(area['areaofwork']?.toString() ?? ''),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete, color: Colors.red),
                                  onPressed: () => _deleteAreaOfWork(
                                    int.parse(area['id']?.toString() ?? '0'),
                                    area['areaofwork']?.toString() ?? '',
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

