import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/shift_provider.dart';
import 'package:intl/intl.dart';

class ShiftScreen extends StatefulWidget {
  const ShiftScreen({super.key});

  @override
  State<ShiftScreen> createState() => _ShiftScreenState();
}

class _ShiftScreenState extends State<ShiftScreen> {
  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    // Load shifts only once when screen is first created
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_hasLoaded && mounted) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final shiftProvider = Provider.of<ShiftProvider>(context, listen: false);
        
        if (!shiftProvider.isLoading) {
          _hasLoaded = true;
          shiftProvider.loadShifts(
            employeeId: authProvider.user?['EMPID']?.toString(),
          );
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final shiftProvider = Provider.of<ShiftProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Shift Schedule'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: shiftProvider.isLoading
                ? null
                : () {
                    shiftProvider.loadShifts(
                      employeeId: authProvider.user?['EMPID']?.toString(),
                      forceRefresh: true,
                    );
                  },
          ),
        ],
      ),
      body: Consumer<ShiftProvider>(
        builder: (context, shiftProvider, _) {
          if (shiftProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (shiftProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    shiftProvider.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      shiftProvider.loadShifts(
                        employeeId: authProvider.user?['EMPID']?.toString(),
                      );
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (shiftProvider.shifts.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.schedule, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No shift assignments found'),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: shiftProvider.shifts.length,
            itemBuilder: (context, index) {
              final shift = shiftProvider.shifts[index];
              final isActive = shift['isActive'] == true || shift['isActive'] == 1;
              
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                elevation: isActive ? 2 : 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(
                    color: isActive
                        ? Theme.of(context).colorScheme.primary.withOpacity(0.3)
                        : Colors.grey.shade200,
                    width: isActive ? 2 : 1,
                  ),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: isActive
                        ? LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              Theme.of(context)
                                  .colorScheme
                                  .primary
                                  .withOpacity(0.05),
                              Theme.of(context)
                                  .colorScheme
                                  .secondary
                                  .withOpacity(0.05),
                            ],
                          )
                        : null,
                    color: isActive ? null : Colors.white,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Theme.of(context)
                                          .colorScheme
                                          .primary
                                          .withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(
                                      Icons.schedule_rounded,
                                      color: Theme.of(context).colorScheme.primary,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Text(
                                      shift['shiftName'] ?? 'Shift',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isActive)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.green,
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.check_circle_rounded,
                                      color: Colors.white,
                                      size: 14,
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      'Active',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        if (shift['startTime'] != null && shift['endTime'] != null)
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.access_time_rounded,
                                  size: 20,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  '${shift['startTime']} - ${shift['endTime']}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        if (shift['assignmentDate'] != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.calendar_today_rounded,
                                  size: 20,
                                  color: Theme.of(context).colorScheme.secondary,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  DateFormat('MMM dd, yyyy').format(
                                    DateTime.parse(shift['assignmentDate']),
                                  ),
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF1E293B),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

