import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/attendance_provider.dart';
import 'package:timesheet_mobile/providers/offline_provider.dart';
import 'package:timesheet_mobile/screens/attendance_screen.dart';
import 'package:timesheet_mobile/screens/leave_screen.dart';
import 'package:timesheet_mobile/screens/timesheet_screen.dart';
import 'package:timesheet_mobile/screens/shift_screen.dart';
import 'package:timesheet_mobile/screens/notification_screen.dart';
import 'package:timesheet_mobile/screens/login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const DashboardTab(),
    const AttendanceScreen(),
    const LeaveScreen(),
    const TimesheetScreen(),
    const NotificationScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Time Sheet'),
        actions: [
          Consumer<OfflineProvider>(
            builder: (context, offlineProvider, _) {
              return Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: offlineProvider.isOnline
                      ? Colors.green.withOpacity(0.2)
                      : Colors.orange.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  offlineProvider.isOnline
                      ? Icons.cloud_done_rounded
                      : Icons.cloud_off_rounded,
                  color: offlineProvider.isOnline ? Colors.green : Colors.orange,
                  size: 20,
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Logout',
            onPressed: () async {
              final authProvider =
                  Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (mounted) {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              }
            },
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_rounded),
              activeIcon: Icon(Icons.dashboard_rounded),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.access_time_rounded),
              activeIcon: Icon(Icons.access_time_rounded),
              label: 'Attendance',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_today_rounded),
              activeIcon: Icon(Icons.calendar_today_rounded),
              label: 'Leave',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.description_rounded),
              activeIcon: Icon(Icons.description_rounded),
              label: 'Timesheet',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_rounded),
              activeIcon: Icon(Icons.notifications_rounded),
              label: 'Notifications',
            ),
          ],
        ),
      ),
    );
  }
}

class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final attendanceProvider = Provider.of<AttendanceProvider>(context);
    final offlineProvider = Provider.of<OfflineProvider>(context);

    return RefreshIndicator(
      onRefresh: () async {
        // Refresh data
      },
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Card with Gradient
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Theme.of(context).colorScheme.primary,
                    Theme.of(context).colorScheme.secondary,
                  ],
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.person_rounded,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Welcome Back',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.white70,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                authProvider.user?['employeeName'] ?? 'Employee',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Attendance Status Cards
            Row(
              children: [
                Expanded(
                  child: _buildModernStatusCard(
                    context,
                    'Status',
                    attendanceProvider.isClockedIn
                        ? 'Clocked In'
                        : 'Clocked Out',
                    attendanceProvider.isClockedIn
                        ? Colors.green
                        : Colors.grey.shade600,
                    Icons.access_time_rounded,
                    attendanceProvider.isClockedIn,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildModernStatusCard(
                    context,
                    'Pending',
                    '${offlineProvider.pendingCount}',
                    Colors.orange,
                    Icons.sync_rounded,
                    offlineProvider.pendingCount > 0,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Quick Actions
            const Text(
              'Quick Actions',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1E293B),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 20),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.0,
              children: [
                _buildModernActionButton(
                  context,
                  'Clock In/Out',
                  Icons.access_time_rounded,
                  Theme.of(context).colorScheme.primary,
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const AttendanceScreen(),
                      ),
                    );
                  },
                ),
                _buildModernActionButton(
                  context,
                  'Apply Leave',
                  Icons.calendar_today_rounded,
                  Theme.of(context).colorScheme.secondary,
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const LeaveScreen(),
                      ),
                    );
                  },
                ),
                _buildModernActionButton(
                  context,
                  'Timesheet',
                  Icons.description_rounded,
                  const Color(0xFF10B981),
                  () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const TimesheetScreen(),
                      ),
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildModernStatusCard(
    BuildContext context,
    String label,
    String value,
    Color color,
    IconData icon,
    bool isActive,
  ) {
    return Card(
      elevation: 3,
      shadowColor: color.withOpacity(0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(
          color: isActive ? color.withOpacity(0.3) : Colors.grey.shade200,
          width: 1.5,
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: isActive ? color.withOpacity(0.06) : Colors.grey.shade50,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 30),
            ),
            const SizedBox(height: 16),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey.shade700,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernActionButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      shadowColor: color.withOpacity(0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: BorderSide(color: Colors.grey.shade200, width: 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        splashColor: color.withOpacity(0.1),
        highlightColor: color.withOpacity(0.05),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: Colors.white,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 30),
              ),
              const SizedBox(height: 14),
              Flexible(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade900,
                    letterSpacing: 0.3,
                    height: 1.3,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

