import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/screens/hr_add_employee_screen.dart';

class HrEmployeeListScreen extends StatefulWidget {
  const HrEmployeeListScreen({super.key});

  @override
  State<HrEmployeeListScreen> createState() => _HrEmployeeListScreenState();
}

class _HrEmployeeListScreenState extends State<HrEmployeeListScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _employees = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadEmployees() async {
    setState(() => _isLoading = true);
    try {
      final employees = await _apiService.getEmployees();
      setState(() {
        _employees = employees;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading employees: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _deleteEmployee(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Employee'),
        content: Text('Are you sure you want to delete $name? This action cannot be undone.'),
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
      await _apiService.deleteEmployee(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Employee $name deleted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        _loadEmployees();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting employee: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<dynamic> get _filteredEmployees {
    final query = _searchController.text.toLowerCase();
    if (query.isEmpty) return _employees;
    return _employees.where((emp) {
      final name = emp['employeeName']?.toString().toLowerCase() ?? '';
      final id = emp['EMPID']?.toString().toLowerCase() ?? '';
      return name.contains(query) || id.contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Employees'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadEmployees,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search employees...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                // Employee List
                Expanded(
                  child: _filteredEmployees.isEmpty
                      ? const Center(child: Text('No employees found'))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filteredEmployees.length,
                          itemBuilder: (context, index) {
                            final employee = _filteredEmployees[index];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: CircleAvatar(
                                  child: Text(
                                    (employee['employeeName']?.toString().substring(0, 1).toUpperCase() ?? 'E'),
                                  ),
                                ),
                                title: Text(employee['employeeName']?.toString() ?? ''),
                                subtitle: Text(employee['EMPID']?.toString() ?? ''),
                                trailing: PopupMenuButton(
                                  itemBuilder: (context) => [
                                    const PopupMenuItem(
                                      value: 'edit',
                                      child: Text('Edit'),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Text('Delete', style: TextStyle(color: Colors.red)),
                                    ),
                                  ],
                                  onSelected: (value) {
                                    if (value == 'edit') {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => HrAddEmployeeScreen(employeeId: employee['id']),
                                        ),
                                      ).then((_) => _loadEmployees());
                                    } else if (value == 'delete') {
                                      _deleteEmployee(
                                        employee['id'],
                                        employee['employeeName']?.toString() ?? '',
                                      );
                                    }
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const HrAddEmployeeScreen(),
            ),
          ).then((_) => _loadEmployees());
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

