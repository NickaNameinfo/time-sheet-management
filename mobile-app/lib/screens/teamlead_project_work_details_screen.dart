import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class TeamLeadProjectWorkDetailsScreen extends StatefulWidget {
  const TeamLeadProjectWorkDetailsScreen({super.key});

  @override
  State<TeamLeadProjectWorkDetailsScreen> createState() => _TeamLeadProjectWorkDetailsScreenState();
}

class _TeamLeadProjectWorkDetailsScreenState extends State<TeamLeadProjectWorkDetailsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _workDetails = [];
  final TextEditingController _searchController = TextEditingController();
  String _filterStatus = 'all'; // all, pending, approved, rejected

  @override
  void initState() {
    super.initState();
    _loadWorkDetails();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadWorkDetails() async {
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

      setState(() {
        _workDetails = filtered;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading work details: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _approveWorkDetail(int workDetailId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: 'workdetails',
        entityId: workDetailId,
        status: 'approved',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Work details for $employeeName approved'),
            backgroundColor: Colors.green,
          ),
        );
        _loadWorkDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _rejectWorkDetail(int workDetailId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: 'workdetails',
        entityId: workDetailId,
        status: 'rejected',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Work details for $employeeName rejected'),
            backgroundColor: Colors.orange,
          ),
        );
        _loadWorkDetails();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<dynamic> get _filteredWorkDetails {
    var filtered = _workDetails;
    
    if (_filterStatus != 'all') {
      filtered = filtered.where((w) {
        final status = w['status']?.toString().toLowerCase() ?? '';
        return status == _filterStatus;
      }).toList();
    }
    
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      filtered = filtered.where((w) {
        final name = w['employeeName']?.toString().toLowerCase() ?? '';
        final project = w['projectName']?.toString().toLowerCase() ?? '';
        return name.contains(query) || project.contains(query);
      }).toList();
    }
    
    return filtered;
  }

  Widget _getStatusChip(String? status) {
    final statusLower = status?.toLowerCase() ?? '';
    if (statusLower == 'approved') {
      return Chip(
        avatar: const Icon(Icons.check_circle, size: 18, color: Colors.white),
        label: const Text('Approved'),
        backgroundColor: Colors.green,
        labelStyle: const TextStyle(color: Colors.white),
      );
    } else if (statusLower == 'rejected') {
      return Chip(
        avatar: const Icon(Icons.cancel, size: 18, color: Colors.white),
        label: const Text('Rejected'),
        backgroundColor: Colors.red,
        labelStyle: const TextStyle(color: Colors.white),
      );
    }
    return Chip(
      label: const Text('Pending'),
      backgroundColor: Colors.orange,
      labelStyle: const TextStyle(color: Colors.white),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Project Work Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadWorkDetails,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Search by employee or project...',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Text('Filter: ', style: TextStyle(fontWeight: FontWeight.w500)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: SegmentedButton<String>(
                              segments: const [
                                ButtonSegment(value: 'all', label: Text('All')),
                                ButtonSegment(value: 'pending', label: Text('Pending')),
                                ButtonSegment(value: 'approved', label: Text('Approved')),
                                ButtonSegment(value: 'rejected', label: Text('Rejected')),
                              ],
                              selected: {_filterStatus},
                              onSelectionChanged: (Set<String> newSelection) {
                                setState(() {
                                  _filterStatus = newSelection.first;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: _filteredWorkDetails.isEmpty
                      ? const Center(child: Text('No work details found'))
                      : RefreshIndicator(
                          onRefresh: _loadWorkDetails,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredWorkDetails.length,
                            itemBuilder: (context, index) {
                              final workDetail = _filteredWorkDetails[index];
                              final status = workDetail['status']?.toString().toLowerCase() ?? '';
                              final isPending = status == 'pending' || status.isEmpty;
                              
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
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  workDetail['employeeName']?.toString() ?? 'N/A',
                                                  style: const TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                Text(
                                                  workDetail['projectName']?.toString() ?? 'N/A',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          _getStatusChip(workDetail['status']?.toString()),
                                        ],
                                      ),
                                      const Divider(),
                                      const SizedBox(height: 8),
                                      _buildInfoRow('Reference No', workDetail['referenceNo']?.toString() ?? 'N/A'),
                                      _buildInfoRow('Week Number', workDetail['weekNumber']?.toString() ?? 'N/A'),
                                      _buildInfoRow('Total Hours', workDetail['totalHours']?.toString() ?? '0.0'),
                                      if (workDetail['sentDate'] != null)
                                        _buildInfoRow('Sent Date', _formatDate(workDetail['sentDate']?.toString())),
                                      if (isPending) ...[
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: ElevatedButton.icon(
                                                onPressed: () => _approveWorkDetail(
                                                  int.parse(workDetail['id']?.toString() ?? '0'),
                                                  workDetail['employeeName']?.toString() ?? '',
                                                ),
                                                icon: const Icon(Icons.check_circle),
                                                label: const Text('Approve'),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.green,
                                                  foregroundColor: Colors.white,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Expanded(
                                              child: ElevatedButton.icon(
                                                onPressed: () => _rejectWorkDetail(
                                                  int.parse(workDetail['id']?.toString() ?? '0'),
                                                  workDetail['employeeName']?.toString() ?? '',
                                                ),
                                                icon: const Icon(Icons.cancel),
                                                label: const Text('Reject'),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor: Colors.red,
                                                  foregroundColor: Colors.white,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
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

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
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

