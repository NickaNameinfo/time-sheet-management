import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:intl/intl.dart';

class HrCompOffApprovalScreen extends StatefulWidget {
  const HrCompOffApprovalScreen({super.key});

  @override
  State<HrCompOffApprovalScreen> createState() => _HrCompOffApprovalScreenState();
}

class _HrCompOffApprovalScreenState extends State<HrCompOffApprovalScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _compOffRequests = [];
  final TextEditingController _searchController = TextEditingController();
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _loadCompOffRequests();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCompOffRequests() async {
    setState(() => _isLoading = true);
    try {
      final compOffDetails = await _apiService.getCompOffDetails();
      setState(() {
        _compOffRequests = compOffDetails;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading comp-off requests: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _approveCompOff(int compOffId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: 'compoff',
        entityId: compOffId,
        status: 'approved',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Comp-off request for $employeeName approved'),
            backgroundColor: Colors.green,
          ),
        );
        _loadCompOffRequests();
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

  Future<void> _rejectCompOff(int compOffId, String employeeName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final approverId = user['id']?.toString() ?? user['employeeId']?.toString() ?? '';
      if (approverId.isEmpty) return;

      await _apiService.approveEntity(
        entityType: 'compoff',
        entityId: compOffId,
        status: 'rejected',
        approverId: approverId,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Comp-off request for $employeeName rejected'),
            backgroundColor: Colors.orange,
          ),
        );
        _loadCompOffRequests();
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
    var filtered = _compOffRequests;
    
    if (_filterStatus != 'all') {
      filtered = filtered.where((req) {
        final status = req['leaveStatus']?.toString().toLowerCase() ?? '';
        return status == _filterStatus;
      }).toList();
    }
    
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      filtered = filtered.where((req) {
        final name = req['employeeName']?.toString().toLowerCase() ?? '';
        return name.contains(query);
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
        title: const Text('Comp-Off Approvals'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCompOffRequests,
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
                          hintText: 'Search by employee name...',
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
                  child: _filteredRequests.isEmpty
                      ? const Center(child: Text('No comp-off requests found'))
                      : RefreshIndicator(
                          onRefresh: _loadCompOffRequests,
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
                                      _buildInfoRow('Work Date', _formatDate(request['leaveFrom']?.toString())),
                                      if (request['workHours'] != null)
                                        _buildInfoRow('Work Hours', request['workHours']?.toString()),
                                      if (request['reason'] != null && request['reason'].toString().isNotEmpty)
                                        _buildInfoRow('Reason', request['reason']?.toString()),
                                      if (isPending) ...[
                                        const SizedBox(height: 12),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: ElevatedButton.icon(
                                                onPressed: () => _approveCompOff(
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
                                                onPressed: () => _rejectCompOff(
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

