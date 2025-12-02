import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class TeamLeadProductivityScreen extends StatefulWidget {
  const TeamLeadProductivityScreen({super.key});

  @override
  State<TeamLeadProductivityScreen> createState() => _TeamLeadProductivityScreenState();
}

class _TeamLeadProductivityScreenState extends State<TeamLeadProductivityScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _workDetails = [];
  Map<String, Map<String, dynamic>> _employeeStats = {};

  @override
  void initState() {
    super.initState();
    _loadProductivityData();
  }

  Future<void> _loadProductivityData() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final teamLeadName = user['tlName']?.toString() ?? user['leadName']?.toString() ?? user['employeeName']?.toString() ?? '';
      
      // Get all work details and filter by team lead
      final allWorkDetails = await _apiService.getWorkDetails();
      final filtered = allWorkDetails.where((w) {
        final tlName = w['tlName']?.toString() ?? '';
        return tlName == teamLeadName || tlName == user['id']?.toString();
      }).toList();

      // Calculate employee statistics
      final employeeStats = <String, Map<String, dynamic>>{};
      for (final work in filtered) {
        final empName = work['employeeName']?.toString() ?? 'Unknown';
        if (!employeeStats.containsKey(empName)) {
          employeeStats[empName] = {
            'totalHours': 0.0,
            'projectCount': <String>{},
            'weekCount': <String>{},
            'approvedCount': 0,
            'pendingCount': 0,
          };
        }
        
        final stats = employeeStats[empName]!;
        final hours = double.tryParse(work['totalHours']?.toString() ?? '0') ?? 0;
        stats['totalHours'] = (stats['totalHours'] as double) + hours;
        
        if (work['projectName'] != null) {
          (stats['projectCount'] as Set).add(work['projectName'].toString());
        }
        
        if (work['weekNumber'] != null) {
          (stats['weekCount'] as Set).add(work['weekNumber'].toString());
        }
        
        final status = work['status']?.toString().toLowerCase() ?? '';
        if (status == 'approved') {
          stats['approvedCount'] = (stats['approvedCount'] as int) + 1;
        } else if (status == 'pending' || status.isEmpty) {
          stats['pendingCount'] = (stats['pendingCount'] as int) + 1;
        }
      }

      setState(() {
        _workDetails = filtered;
        _employeeStats = employeeStats;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading productivity data: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Productivity'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProductivityData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProductivityData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Summary Card
                    Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Team Summary',
                              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildSummaryItem(
                                    'Team Members',
                                    '${_employeeStats.length}',
                                    Icons.people,
                                    Colors.blue,
                                  ),
                                ),
                                Expanded(
                                  child: _buildSummaryItem(
                                    'Total Hours',
                                    _workDetails.fold<double>(0, (sum, w) {
                                      return sum + (double.tryParse(w['totalHours']?.toString() ?? '0') ?? 0);
                                    }).toStringAsFixed(1),
                                    Icons.access_time,
                                    Colors.green,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Employee Productivity List
                    const Text(
                      'Employee Productivity',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _employeeStats.isEmpty
                        ? const Center(child: Text('No productivity data available'))
                        : ..._employeeStats.entries.map((entry) {
                            final empName = entry.key;
                            final stats = entry.value;
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              elevation: 2,
                              child: Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          empName,
                                          style: const TextStyle(
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        Chip(
                                          label: Text('${(stats['totalHours'] as double).toStringAsFixed(1)}h'),
                                          backgroundColor: Colors.blue,
                                          labelStyle: const TextStyle(color: Colors.white),
                                        ),
                                      ],
                                    ),
                                    const Divider(),
                                    const SizedBox(height: 8),
                                    _buildProductivityRow(
                                      'Total Hours',
                                      '${(stats['totalHours'] as double).toStringAsFixed(2)} hours',
                                    ),
                                    _buildProductivityRow(
                                      'Projects',
                                      '${(stats['projectCount'] as Set).length}',
                                    ),
                                    _buildProductivityRow(
                                      'Weeks',
                                      '${(stats['weekCount'] as Set).length}',
                                    ),
                                    _buildProductivityRow(
                                      'Approved',
                                      '${stats['approvedCount']}',
                                      color: Colors.green,
                                    ),
                                    _buildProductivityRow(
                                      'Pending',
                                      '${stats['pendingCount']}',
                                      color: Colors.orange,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, size: 32, color: color),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildProductivityRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

