import 'package:flutter/material.dart';
import 'package:timesheet_mobile/screens/hr_leave_balance_screen.dart';
import 'package:timesheet_mobile/screens/hr_employee_list_screen.dart';
import 'package:timesheet_mobile/screens/hr_settings_screen.dart';
import 'package:timesheet_mobile/screens/hr_add_updates_screen.dart';
import 'package:timesheet_mobile/screens/employee_profile_screen.dart';
import 'package:timesheet_mobile/screens/employee_time_management_screen.dart';
import 'package:timesheet_mobile/screens/employee_add_leaves_screen.dart';
import 'package:timesheet_mobile/screens/employee_compoff_screen.dart';
import 'package:timesheet_mobile/screens/hr_leave_approval_screen.dart';
import 'package:timesheet_mobile/screens/hr_compoff_approval_screen.dart';

class HrDashboardScreen extends StatefulWidget {
  const HrDashboardScreen({super.key});

  @override
  State<HrDashboardScreen> createState() => _HrDashboardScreenState();
}

class _HrDashboardScreenState extends State<HrDashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HrLeaveBalanceScreen(),
    const HrEmployeeListScreen(),
    const HrSettingsScreen(),
    const HrAddUpdatesScreen(),
    const EmployeeProfileScreen(),
  ];

  // Common screens accessible via drawer
  void _navigateToScreen(Widget screen) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => screen),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HR Dashboard'),
        actions: [
          PopupMenuButton(
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'leaveApproval',
                child: Row(
                  children: [
                    Icon(Icons.approval),
                    SizedBox(width: 8),
                    Text('Leave Approvals'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'compoffApproval',
                child: Row(
                  children: [
                    Icon(Icons.work_off),
                    SizedBox(width: 8),
                    Text('Comp-Off Approvals'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
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
                case 'leaveApproval':
                  _navigateToScreen(const HrLeaveApprovalScreen());
                  break;
                case 'compoffApproval':
                  _navigateToScreen(const HrCompOffApprovalScreen());
                  break;
                case 'time':
                  _navigateToScreen(const EmployeeTimeManagementScreen());
                  break;
                case 'leave':
                  _navigateToScreen(const EmployeeAddLeavesScreen());
                  break;
                case 'compoff':
                  _navigateToScreen(const EmployeeCompOffScreen());
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
            icon: Icon(Icons.event_available),
            label: 'Leave Balance',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'Employees',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.announcement),
            label: 'Updates',
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

