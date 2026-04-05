import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/screens/employee_home_screen.dart';
import 'package:timesheet_mobile/screens/employee_time_management_screen.dart';
import 'package:timesheet_mobile/screens/employee_add_leaves_screen.dart';
import 'package:timesheet_mobile/screens/employee_compoff_screen.dart';
import 'package:timesheet_mobile/screens/employee_profile_screen.dart';
import 'package:timesheet_mobile/screens/login_screen.dart';
import 'package:timesheet_mobile/theme/app_brand_colors.dart';
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

  Future<void> _onLogoutPressed(BuildContext context) async {
    final navigator = Navigator.of(context);
    final auth = context.read<AuthProvider>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await auth.logout();
      if (!mounted) return;
      navigator.pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final name = AppConfig.displayNameForUser(user);
    final isCompany = user?['isCompanyUser'] == true;
    final companyName = user?['company_name']?.toString().trim() ?? '';
    final roleLabel = (user?['employee_table_role'] ?? user?['company_menu_role'])?.toString().trim() ?? '';
    final subtitle = [
      if (isCompany && companyName.isNotEmpty) companyName,
      if (isCompany && roleLabel.isNotEmpty) roleLabel,
    ].join(' · ');
    final topInset = MediaQuery.paddingOf(context).top;
    final barHeight = topInset + 72;

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: Size.fromHeight(barHeight),
        child: _EmployeeDashboardTopBar(
          topInset: topInset,
          name: name,
          isCompany: isCompany,
          subtitle: subtitle,
          onLogout: () => _onLogoutPressed(context),
        ),
      ),
      body: _screens[_currentIndex],
      bottomNavigationBar: _EmployeeBottomNavBar(
        currentIndex: _currentIndex.clamp(0, 4),
        onSelectTab: (index) => setState(() => _currentIndex = index),
        onMySelf: _openMySelf,
      ),
    );
  }
}

/// Blue → green gradient, brand logo tile, name lines, profile photo, logout (aligned with web palette).
class _EmployeeDashboardTopBar extends StatelessWidget {
  const _EmployeeDashboardTopBar({
    required this.topInset,
    required this.name,
    required this.isCompany,
    required this.subtitle,
    required this.onLogout,
  });

  final double topInset;
  final String name;
  final bool isCompany;
  final String subtitle;
  final VoidCallback onLogout;

  static const _gradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      AppBrandColors.blue,
      Color(0xFF3D6FEB),
      AppBrandColors.green,
    ],
    stops: [0.0, 0.45, 1.0],
  );

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 6,
      shadowColor: AppBrandColors.blue.withValues(alpha: 0.35),
      child: Container(
        height: topInset + 72,
        decoration: const BoxDecoration(gradient: _gradient),
        padding: EdgeInsets.only(top: topInset, left: 12, right: 4, bottom: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(5),
              child: Image.asset(
                'assets/icons/app_icon.png',
                fit: BoxFit.contain,
                gaplessPlayback: true,
                errorBuilder: (_, __, ___) => Icon(
                  Icons.schedule_rounded,
                  color: AppBrandColors.blue,
                  size: 22,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (isCompany) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppBrandColors.amber.withValues(alpha: 0.28),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppBrandColors.amber.withValues(alpha: 0.65),
                              width: 1,
                            ),
                          ),
                          child: const Text(
                            'Company',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Expanded(
                        child: Text(
                          isCompany ? name : 'Hello, $name!',
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: 0.2,
                            height: 1.15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Container(
                          width: 3,
                          height: 14,
                          decoration: BoxDecoration(
                            color: AppBrandColors.amber,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            subtitle,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withValues(alpha: 0.92),
                              height: 1.2,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
            IconButton(
              onPressed: onLogout,
              tooltip: 'Logout',
              icon: const Icon(Icons.logout_rounded, color: Colors.white, size: 24),
              style: IconButton.styleFrom(
                foregroundColor: Colors.white,
                backgroundColor: Colors.white.withValues(alpha: 0.14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Brand-aligned bottom nav: blue selected state, amber "My Self", green–blue accent strip.
class _EmployeeBottomNavBar extends StatelessWidget {
  const _EmployeeBottomNavBar({
    required this.currentIndex,
    required this.onSelectTab,
    required this.onMySelf,
  });

  final int currentIndex;
  final ValueChanged<int> onSelectTab;
  final Future<void> Function() onMySelf;

  static const _inactive = Color(0xFF94A3B8);

  @override
  Widget build(BuildContext context) {
    const tabs = <(IconData, String)>[
      (Icons.home_rounded, 'Home'),
      (Icons.schedule_rounded, 'Time'),
      (Icons.event_note_rounded, 'Leave'),
      (Icons.work_history_rounded, 'Comp-Off'),
      (Icons.person_rounded, 'Profile'),
    ];

    return Material(
      elevation: 0,
      color: Colors.transparent,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: 3,
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppBrandColors.blue, AppBrandColors.green],
              ),
            ),
          ),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: AppBrandColors.blue.withOpacity(0.1),
                  blurRadius: 24,
                  offset: const Offset(0, -8),
                ),
              ],
            ),
            child: SafeArea(
              top: false,
              minimum: const EdgeInsets.only(bottom: 4),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
                child: Row(
                  children: [
                    for (var i = 0; i < tabs.length; i++)
                      Expanded(
                        child: _NavEntry(
                          icon: tabs[i].$1,
                          label: tabs[i].$2,
                          selected: currentIndex == i,
                          activeColor: AppBrandColors.blue,
                          inactiveColor: _inactive,
                          onTap: () => onSelectTab(i),
                        ),
                      ),
                    Expanded(
                      child: _NavEntry(
                        icon: Icons.self_improvement_rounded,
                        label: 'My Self',
                        selected: false,
                        activeColor: AppBrandColors.amber,
                        inactiveColor: AppBrandColors.amber,
                        highlightBackground: AppBrandColors.amber.withOpacity(0.14),
                        onTap: () => onMySelf(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavEntry extends StatelessWidget {
  const _NavEntry({
    required this.icon,
    required this.label,
    required this.selected,
    required this.activeColor,
    required this.inactiveColor,
    required this.onTap,
    this.highlightBackground,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final Color activeColor;
  final Color inactiveColor;
  final VoidCallback onTap;
  final Color? highlightBackground;

  @override
  Widget build(BuildContext context) {
    final color = selected ? activeColor : inactiveColor;
    final bg = selected
        ? activeColor.withOpacity(0.12)
        : highlightBackground;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        splashColor: activeColor.withOpacity(0.12),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOutCubic,
                padding: EdgeInsets.all(selected ? 8 : 6),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  icon,
                  size: selected ? 26 : 24,
                  color: color,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
                  color: color,
                  letterSpacing: selected ? 0.2 : 0,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

