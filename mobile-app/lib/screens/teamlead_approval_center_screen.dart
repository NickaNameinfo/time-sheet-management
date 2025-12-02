import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class TeamLeadApprovalCenterScreen extends StatefulWidget {
  const TeamLeadApprovalCenterScreen({super.key});

  @override
  State<TeamLeadApprovalCenterScreen> createState() => _TeamLeadApprovalCenterScreenState();
}

class _TeamLeadApprovalCenterScreenState extends State<TeamLeadApprovalCenterScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _pendingApprovals = [];
  String _selectedType = 'all'; // all, leave, compoff, workdetails

  @override
  void initState() {
    super.initState();
    _loadPendingApprovals();
  }

  Future<void> _loadPendingApprovals() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      
      // Get pending approvals
      final approvals = await _apiService.getPendingApprovals(approverId: approverId);
      
      setState(() {
        _pendingApprovals = approvals;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading approvals: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _approveRequest(String entityType, int entityId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: entityType,
        entityId: entityId,
        status: 'approved',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Request for $employeeName approved'),
            backgroundColor: Colors.green,
          ),
        );
        _loadPendingApprovals();
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

  Future<void> _rejectRequest(String entityType, int entityId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: entityType,
        entityId: entityId,
        status: 'rejected',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Request for $employeeName rejected'),
            backgroundColor: Colors.orange,
          ),
        );
        _loadPendingApprovals();
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

  List<dynamic> get _filteredApprovals {
    if (_selectedType == 'all') return _pendingApprovals;
    return _pendingApprovals.where((a) {
      final type = a['entityType']?.toString().toLowerCase() ?? '';
      return type == _selectedType;
    }).toList();
  }

  String _getEntityTypeLabel(String? type) {
    switch (type?.toLowerCase()) {
      case 'leave':
        return 'Leave Request';
      case 'compoff':
        return 'Comp-Off Request';
      case 'workdetails':
      case 'timesheet':
        return 'Work Details';
      default:
        return type ?? 'Request';
    }
  }

  IconData _getEntityTypeIcon(String? type) {
    switch (type?.toLowerCase()) {
      case 'leave':
        return Icons.calendar_today;
      case 'compoff':
        return Icons.work;
      case 'workdetails':
      case 'timesheet':
        return Icons.assignment;
      default:
        return Icons.description;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Approval Center'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadPendingApprovals,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Text('Filter: ', style: TextStyle(fontWeight: FontWeight.w500)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: SegmentedButton<String>(
                          segments: const [
                            ButtonSegment(value: 'all', label: Text('All')),
                            ButtonSegment(value: 'leave', label: Text('Leave')),
                            ButtonSegment(value: 'compoff', label: Text('Comp-Off')),
                            ButtonSegment(value: 'workdetails', label: Text('Work')),
                          ],
                          selected: {_selectedType},
                          onSelectionChanged: (Set<String> newSelection) {
                            setState(() {
                              _selectedType = newSelection.first;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: _filteredApprovals.isEmpty
                      ? const Center(child: Text('No pending approvals'))
                      : RefreshIndicator(
                          onRefresh: _loadPendingApprovals,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredApprovals.length,
                            itemBuilder: (context, index) {
                              final approval = _filteredApprovals[index];
                              final entityType = approval['entityType']?.toString() ?? '';
                              
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                elevation: 2,
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            _getEntityTypeIcon(entityType),
                                            color: Colors.blue,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              _getEntityTypeLabel(entityType),
                                              style: const TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                          Chip(
                                            label: const Text('Pending'),
                                            backgroundColor: Colors.orange,
                                            labelStyle: const TextStyle(color: Colors.white),
                                          ),
                                        ],
                                      ),
                                      const Divider(),
                                      const SizedBox(height: 8),
                                      _buildInfoRow('Employee', approval['employeeName']?.toString() ?? 'N/A'),
                                      if (approval['projectName'] != null)
                                        _buildInfoRow('Project', approval['projectName']?.toString() ?? 'N/A'),
                                      if (approval['leaveType'] != null)
                                        _buildInfoRow('Leave Type', approval['leaveType']?.toString() ?? 'N/A'),
                                      if (approval['totalHours'] != null)
                                        _buildInfoRow('Total Hours', approval['totalHours']?.toString() ?? '0.0'),
                                      if (approval['appliedDate'] != null)
                                        _buildInfoRow('Applied Date', _formatDate(approval['appliedDate']?.toString())),
                                      const SizedBox(height: 12),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () => _approveRequest(
                                                entityType,
                                                int.parse(approval['entityId']?.toString() ?? '0'),
                                                approval['employeeName']?.toString() ?? '',
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
                                              onPressed: () => _rejectRequest(
                                                entityType,
                                                int.parse(approval['entityId']?.toString() ?? '0'),
                                                approval['employeeName']?.toString() ?? '',
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

