import 'package:flutter/material.dart';
import 'package:timesheet_mobile/screens/employee_home_screen.dart';
import 'package:timesheet_mobile/screens/employee_time_management_screen.dart';
import 'package:timesheet_mobile/screens/employee_add_leaves_screen.dart';
import 'package:timesheet_mobile/screens/employee_compoff_screen.dart';
import 'package:timesheet_mobile/screens/employee_profile_screen.dart';
import 'package:timesheet_mobile/screens/employee_shift_details_screen.dart';

class EmployeeDashboardScreen extends StatefulWidget {
  const EmployeeDashboardScreen({super.key});

  @override
  State<EmployeeDashboardScreen> createState() => _EmployeeDashboardScreenState();
}

class _EmployeeDashboardScreenState extends State<EmployeeDashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const EmployeeHomeScreen(),
    const EmployeeTimeManagementScreen(),
    const EmployeeAddLeavesScreen(),
    const EmployeeCompOffScreen(),
    const EmployeeProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.access_time),
            label: 'Time',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: 'Leave',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.work),
            label: 'Comp-Off',
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

