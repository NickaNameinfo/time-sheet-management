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
  Set<String> _selectedItems = {}; // Store as "entityType:entityId"
  bool _isBulkProcessing = false;

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

  void _toggleSelection(String entityType, int entityId) {
    setState(() {
      final key = '$entityType:$entityId';
      if (_selectedItems.contains(key)) {
        _selectedItems.remove(key);
      } else {
        _selectedItems.add(key);
      }
    });
  }

  bool _isSelected(String entityType, int entityId) {
    return _selectedItems.contains('$entityType:$entityId');
  }

  Future<void> _handleBulkAction(String status) async {
    if (_selectedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select items to $status')),
      );
      return;
    }

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Confirm Bulk ${status == 'approved' ? 'Approve' : 'Reject'}'),
        content: Text('Are you sure you want to ${status} ${_selectedItems.length} item(s)?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: status == 'approved' ? Colors.green : Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(status == 'approved' ? 'Approve' : 'Reject'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isBulkProcessing = true);

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      // Group by entity type
      final Map<String, List<int>> grouped = {};
      for (final key in _selectedItems) {
        final parts = key.split(':');
        if (parts.length == 2) {
          final entityType = parts[0];
          final entityId = int.tryParse(parts[1]);
          if (entityId != null) {
            grouped.putIfAbsent(entityType, () => []).add(entityId);
          }
        }
      }

      // Process each group
      int successCount = 0;
      int errorCount = 0;
      final List<String> errors = [];

      for (final entry in grouped.entries) {
        try {
          await _apiService.bulkApprove(
            entityType: entry.key,
            entityIds: entry.value,
            status: status,
            approverId: approverId,
            comments: 'Bulk $status',
          );
          successCount += entry.value.length;
        } catch (e) {
          errorCount += entry.value.length;
          errors.add('${entry.key}: ${e.toString()}');
        }
      }

      if (mounted) {
        setState(() {
          _selectedItems.clear();
        });

        if (errorCount == 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Successfully ${status} $successCount item(s)'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${status == 'approved' ? 'Approved' : 'Rejected'} $successCount, failed: $errorCount'),
              backgroundColor: Colors.orange,
              duration: const Duration(seconds: 5),
            ),
          );
        }

        _loadPendingApprovals();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isBulkProcessing = false);
      }
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
      floatingActionButton: _selectedItems.isNotEmpty
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FloatingActionButton.extended(
                  onPressed: _isBulkProcessing ? null : () => _handleBulkAction('approved'),
                  backgroundColor: Colors.green,
                  icon: const Icon(Icons.check_circle, color: Colors.white),
                  label: Text(
                    'Approve (${_selectedItems.length})',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
                const SizedBox(height: 8),
                FloatingActionButton.extended(
                  onPressed: _isBulkProcessing ? null : () => _handleBulkAction('rejected'),
                  backgroundColor: Colors.red,
                  icon: const Icon(Icons.cancel, color: Colors.white),
                  label: Text(
                    'Reject (${_selectedItems.length})',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            )
          : null,
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
                              
                              final entityId = int.tryParse(approval['entityId']?.toString() ?? '0') ?? 0;
                              final isSelected = _isSelected(entityType, entityId);

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                elevation: isSelected ? 4 : 2,
                                color: isSelected ? Colors.blue[50] : null,
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Checkbox(
                                            value: isSelected,
                                            onChanged: (value) => _toggleSelection(entityType, entityId),
                                          ),
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

