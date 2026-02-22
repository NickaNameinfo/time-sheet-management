import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/screens/teamlead_home_screen.dart';
import 'package:timesheet_mobile/screens/employee_time_management_screen.dart';
import 'package:timesheet_mobile/screens/employee_add_leaves_screen.dart';
import 'package:timesheet_mobile/screens/employee_compoff_screen.dart';
import 'package:timesheet_mobile/screens/employee_profile_screen.dart';
import 'package:timesheet_mobile/screens/teamlead_project_work_details_screen.dart';
import 'package:timesheet_mobile/screens/teamlead_approval_center_screen.dart';
import 'package:timesheet_mobile/screens/teamlead_productivity_screen.dart';
import 'package:timesheet_mobile/screens/login_screen.dart';

class TeamLeadDashboardScreen extends StatefulWidget {
  const TeamLeadDashboardScreen({super.key});

  @override
  State<TeamLeadDashboardScreen> createState() => _TeamLeadDashboardScreenState();
}

class _TeamLeadDashboardScreenState extends State<TeamLeadDashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const TeamLeadHomeScreen(),
    const TeamLeadProjectWorkDetailsScreen(),
    const TeamLeadApprovalCenterScreen(),
    const TeamLeadProductivityScreen(),
    const EmployeeProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = (user?['tlName'] ?? user?['leadName'] ?? user?['employeeName'] ?? user?['userName'] ?? 'User').toString();
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Hello, $name!',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, _) {
              return IconButton(
                icon: const Icon(Icons.logout),
                tooltip: 'Logout',
                onPressed: () async {
                  final confirm = await showDialog<bool>(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Logout'),
                      content: const Text('Are you sure you want to logout?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Logout', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  );

                  if (confirm == true && mounted) {
                    await authProvider.logout();
                    if (mounted) {
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(builder: (_) => LoginScreen()),
                        (route) => false,
                      );
                    }
                  }
                },
              );
            },
          ),
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'time',
                child: Row(
                  children: [
                    Icon(Icons.access_time),
                    SizedBox(width: 8),
                    Text('Time Management'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'leave',
                child: Row(
                  children: [
                    Icon(Icons.calendar_today),
                    SizedBox(width: 8),
                    Text('Apply Leave'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'compoff',
                child: Row(
                  children: [
                    Icon(Icons.work),
                    SizedBox(width: 8),
                    Text('Comp-Off'),
                  ],
                ),
              ),
            ],
            onSelected: (value) {
              switch (value) {
                case 'time':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EmployeeTimeManagementScreen()),
                  );
                  break;
                case 'leave':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EmployeeAddLeavesScreen()),
                  );
                  break;
                case 'compoff':
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const EmployeeCompOffScreen()),
                  );
                  break;
              }
            },
          ),
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Work Details',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.approval),
            label: 'Approvals',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.trending_up),
            label: 'Productivity',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

