import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/screens/employee_home_screen.dart';
import 'package:timesheet_mobile/screens/employee_time_management_screen.dart';
import 'package:timesheet_mobile/screens/employee_add_leaves_screen.dart';
import 'package:timesheet_mobile/screens/employee_compoff_screen.dart';
import 'package:timesheet_mobile/screens/employee_profile_screen.dart';
import 'package:timesheet_mobile/screens/employee_shift_details_screen.dart';
import 'package:timesheet_mobile/screens/login_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_dashboard_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_login_screen.dart';
import 'package:timesheet_mobile/providers/challenge_auth_provider.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/utils/app_config.dart';

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

  Future<void> _openMySelf() async {
    final prefs = await SharedPreferences.getInstance();
    final challengeToken = prefs.getString(AppConfig.challengeTokenKey);
    if (challengeToken != null) {
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const ChallengeDashboardScreen()),
      );
      return;
    }
    final employeeToken = prefs.getString(AppConfig.tokenKey);
    if (employeeToken != null) {
      try {
        final result = await ChallengeApiService().accessWithEmployeeToken(employeeToken);
        final token = result['token'] as String?;
        final user = result['user'] as Map<String, dynamic>?;
        if (token != null && user != null && mounted) {
          await context.read<ChallengeAuthProvider>().setSessionFromSso(token, user);
          if (!mounted) return;
          Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ChallengeDashboardScreen()),
          );
          return;
        }
      } catch (_) {
        // SSO failed (e.g. no employee email); fall back to login screen
      }
    }
    if (!mounted) return;
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ChallengeLoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = (user?['employeeName'] ?? user?['userName'] ?? 'User').toString();
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Hello, $name!',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
        automaticallyImplyLeading: false,
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
        ],
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex.clamp(0, 4),
        onTap: (index) async {
          if (index == 5) {
            await _openMySelf();
            return;
          }
          setState(() => _currentIndex = index);
        },
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
          BottomNavigationBarItem(
            icon: Icon(Icons.self_improvement_rounded),
            label: 'My Self',
          ),
        ],
      ),
    );
  }
}

