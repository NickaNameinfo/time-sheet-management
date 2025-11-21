import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/timesheet_provider.dart';
import 'package:intl/intl.dart';

class TimesheetScreen extends StatefulWidget {
  const TimesheetScreen({super.key});

  @override
  State<TimesheetScreen> createState() => _TimesheetScreenState();
}

class _TimesheetScreenState extends State<TimesheetScreen> {
  DateTime _startDate = DateTime.now().subtract(const Duration(days: 7));
  DateTime _endDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadTimesheet();
  }

  Future<void> _loadTimesheet({bool forceRefresh = false}) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final timesheetProvider =
        Provider.of<TimesheetProvider>(context, listen: false);

    await timesheetProvider.loadTimesheet(
      employeeId: authProvider.user?['EMPID']?.toString(),
      startDate: DateFormat('yyyy-MM-dd').format(_startDate),
      endDate: DateFormat('yyyy-MM-dd').format(_endDate),
      forceRefresh: forceRefresh,
    );
  }

  Future<void> _selectDateRange() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now(),
      initialDateRange: DateTimeRange(start: _startDate, end: _endDate),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _loadTimesheet();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Timesheet'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            tooltip: 'Filter',
            onPressed: _selectDateRange,
          ),
          Consumer<TimesheetProvider>(
            builder: (context, timesheetProvider, _) {
              return IconButton(
                icon: const Icon(Icons.refresh_rounded),
                tooltip: 'Refresh',
                onPressed: timesheetProvider.isLoading
                    ? null
                    : () => _loadTimesheet(forceRefresh: true),
              );
            },
          ),
        ],
      ),
      body: Consumer<TimesheetProvider>(
        builder: (context, timesheetProvider, _) {
          if (timesheetProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          // Only show error if we have no data to display
          if (timesheetProvider.error != null && timesheetProvider.timesheets.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.red.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.error_outline_rounded,
                        size: 64,
                        color: Colors.red,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'Connection Error',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      timesheetProvider.error!,
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    ElevatedButton.icon(
                      onPressed: () => _loadTimesheet(forceRefresh: true),
                      icon: const Icon(Icons.refresh_rounded),
                      label: const Text('Retry'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          // Show empty state only if no error and no data
          if (timesheetProvider.timesheets.isEmpty && timesheetProvider.error == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.description_rounded,
                        size: 64,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      'No Timesheet Records',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '${DateFormat('MMM dd, yyyy').format(_startDate)} - ${DateFormat('MMM dd, yyyy').format(_endDate)}',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'No records found for this date range',
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
          
          // If we have an error but also have data, show data with a warning banner
          final hasErrorWithData = timesheetProvider.error != null && 
                                   timesheetProvider.timesheets.isNotEmpty;

          return Column(
            children: [
              if (hasErrorWithData)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, 
                        color: Colors.orange.shade700, 
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Showing cached data. ${timesheetProvider.error}',
                          style: TextStyle(
                            color: Colors.orange.shade900,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              if (timesheetProvider.timesheets.isNotEmpty) ...[
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Card(
                    child: Container(
                      padding: const EdgeInsets.all(20.0),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Theme.of(context).colorScheme.primary.withOpacity(0.1),
                            Theme.of(context).colorScheme.secondary.withOpacity(0.1),
                          ],
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.date_range_rounded,
                                    size: 18,
                                    color: Theme.of(context).colorScheme.primary,
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Date Range',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${DateFormat('MMM dd').format(_startDate)} - ${DateFormat('MMM dd, yyyy').format(_endDate)}',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    Icons.list_rounded,
                                    size: 18,
                                    color: Theme.of(context).colorScheme.secondary,
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Total Records',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                '${timesheetProvider.timesheets.length}',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).colorScheme.secondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: timesheetProvider.timesheets.length,
                  itemBuilder: (context, index) {
                    final timesheet = timesheetProvider.timesheets[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .primary
                                .withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            Icons.access_time_rounded,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        title: Text(
                          timesheet['projectName'] ?? 'No Project',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (timesheet['date'] != null)
                                Row(
                                  children: [
                                    Icon(
                                      Icons.calendar_today_rounded,
                                      size: 14,
                                      color: Colors.grey.shade600,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      DateFormat('MMM dd, yyyy')
                                          .format(DateTime.parse(timesheet['date'])),
                                      style: TextStyle(
                                        color: Colors.grey.shade700,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              if (timesheet['totalHours'] != null) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.timer_rounded,
                                      size: 14,
                                      color: Colors.grey.shade600,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Hours: ${timesheet['totalHours']}',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: Theme.of(context).colorScheme.primary,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                        trailing: _getStatusIcon(timesheet['status']),
                      ),
                    );
                  },
                ),
              ),
              ],
            ],
          );
        },
      ),
    );
  }

  Widget? _getStatusIcon(String? status) {
    if (status == null) return null;

    switch (status.toLowerCase()) {
      case 'approved':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.check_circle_rounded, color: Colors.green, size: 18),
              SizedBox(width: 4),
              Text(
                'Approved',
                style: TextStyle(
                  color: Colors.green,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      case 'pending':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.orange.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.pending_rounded, color: Colors.orange, size: 18),
              SizedBox(width: 4),
              Text(
                'Pending',
                style: TextStyle(
                  color: Colors.orange,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      case 'rejected':
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.cancel_rounded, color: Colors.red, size: 18),
              SizedBox(width: 4),
              Text(
                'Rejected',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        );
      default:
        return null;
    }
  }
}

