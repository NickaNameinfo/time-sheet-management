import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class HrLeaveApprovalScreen extends StatefulWidget {
  const HrLeaveApprovalScreen({super.key});

  @override
  State<HrLeaveApprovalScreen> createState() => _HrLeaveApprovalScreenState();
}

class _HrLeaveApprovalScreenState extends State<HrLeaveApprovalScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _leaveRequests = [];
  final TextEditingController _searchController = TextEditingController();
  String _filterStatus = 'all'; // all, pending, approved, rejected

  @override
  void initState() {
    super.initState();
    _loadLeaveRequests();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadLeaveRequests() async {
    setState(() => _isLoading = true);
    try {
      final leaveDetails = await _apiService.getLeaveDetails();
      setState(() {
        _leaveRequests = leaveDetails;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading leave requests: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _approveLeave(int leaveId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: 'leave',
        entityId: leaveId,
        status: 'approved',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Leave request for $employeeName approved'),
            backgroundColor: Colors.green,
          ),
        );
        _loadLeaveRequests();
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

  Future<void> _rejectLeave(int leaveId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: 'leave',
        entityId: leaveId,
        status: 'rejected',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Leave request for $employeeName rejected'),
            backgroundColor: Colors.orange,
          ),
        );
        _loadLeaveRequests();
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

  List<dynamic> get _filteredRequests {
    var filtered = _leaveRequests;
    
    // Filter by status
    if (_filterStatus != 'all') {
      filtered = filtered.where((req) {
        final status = req['leaveStatus']?.toString().toLowerCase() ?? '';
        return status == _filterStatus;
      }).toList();
    }
    
    // Filter by search
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      filtered = filtered.where((req) {
        final name = req['employeeName']?.toString().toLowerCase() ?? '';
        final type = req['leaveType']?.toString().toLowerCase() ?? '';
        return name.contains(query) || type.contains(query);
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
        title: const Text('Leave Approvals'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadLeaveRequests,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Search and Filter
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Search by employee name or leave type...',
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
                // Leave Requests List
                Expanded(
                  child: _filteredRequests.isEmpty
                      ? const Center(child: Text('No leave requests found'))
                      : RefreshIndicator(
                          onRefresh: _loadLeaveRequests,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredRequests.length,
                            itemBuilder: (context, index) {
                              final request = _filteredRequests[index];
                              final status = request['leaveStatus']?.toString().toLowerCase() ?? '';
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
                                                  request['employeeName']?.toString() ?? 'N/A',
                                                  style: const TextStyle(
                                                    fontSize: 18,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                                Text(
                                                  'ID: ${request['employeeId']?.toString() ?? 'N/A'}',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    color: Colors.grey[600],
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          _getStatusChip(request['leaveStatus']?.toString()),
                                        ],
                                      ),
                                      const Divider(),
                                      const SizedBox(height: 8),
                                      _buildInfoRow('Leave Type', request['leaveType']?.toString() ?? 'N/A'),
                                      _buildInfoRow('From Date', _formatDate(request['leaveFrom']?.toString())),
                                      _buildInfoRow('To Date', _formatDate(request['leaveTo']?.toString())),
                                      if (request['leaveHours'] != null)
                                        _buildInfoRow('Hours', request['leaveHours']?.toString() ?? 'N/A'),
                                      if (request['reason'] != null && request['reason'].toString().isNotEmpty)
                                        _buildInfoRow('Reason', request['reason']?.toString() ?? 'N/A'),
                                      if (request['appliedDate'] != null)
                                        _buildInfoRow('Applied Date', _formatDate(request['appliedDate']?.toString())),
                                      if (isPending) ...[
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: ElevatedButton.icon(
                                                onPressed: () => _approveLeave(
                                                  int.parse(request['id']?.toString() ?? '0'),
                                                  request['employeeName']?.toString() ?? '',
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
                                                onPressed: () => _rejectLeave(
                                                  int.parse(request['id']?.toString() ?? '0'),
                                                  request['employeeName']?.toString() ?? '',
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

