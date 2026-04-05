import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/providers/challenge_auth_provider.dart';
import 'package:timesheet_mobile/screens/login_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_login_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_dashboard_screen.dart';
import 'package:timesheet_mobile/services/notification_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final prefs = await SharedPreferences.getInstance();
    final hasLaunchedBefore = prefs.getBool(AppConfig.firstLaunchDoneKey) ?? false;
    if (!hasLaunchedBefore) {
      await prefs.remove(AppConfig.tokenKey);
      await prefs.remove(AppConfig.userKey);
      await prefs.remove('clock_in_time');
      await prefs.remove('work_detail_id');
      await prefs.remove('is_clocked_in');
      await prefs.remove('current_working_hours');
      await prefs.setBool(AppConfig.firstLaunchDoneKey, true);
    }
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    // Request reminder/notification permission early so reminders work when app is closed
    await NotificationService.requestReminderPermissions();
    if (!mounted) return;
    setState(() {});
  }

  void _navigateToTimeSheet() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => LoginScreen()),
    );
  }

  Future<void> _navigateToDailyChallenge() async {
    await context.read<ChallengeAuthProvider>().sessionReady;
    if (!mounted) return;
    final challengeAuth = context.read<ChallengeAuthProvider>();
    final prefs = await SharedPreferences.getInstance();
    final challengeToken = prefs.getString(AppConfig.challengeTokenKey);
    if (!mounted) return;
    final goDashboard = challengeToken != null && challengeAuth.isAuthenticated;
    if (goDashboard) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const ChallengeDashboardScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const ChallengeLoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              primary,
              Theme.of(context).colorScheme.secondary,
              Color.lerp(primary, Theme.of(context).colorScheme.secondary, 0.5)!,
            ],
            stops: const [0.0, 0.5, 1.0],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              children: [
                const SizedBox(height: 48),
                Container(
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.18),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.access_time_rounded,
                    size: 88,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 32),
                const Text(
                  'Welcome',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Choose an app to continue',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white.withOpacity(0.92),
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 40),
                _OptionCard(
                  onTap: _navigateToTimeSheet,
                  icon: Icons.schedule_rounded,
                  iconBgColor: Colors.white,
                  iconColor: primary,
                  title: 'Time Sheet',
                  subtitle: 'Company portal, employee, HR & team lead — clock in, leaves, hours',
                  isPrimary: true,
                ),
                const SizedBox(height: 20),
                _OptionCard(
                  onTap: _navigateToDailyChallenge,
                  icon: Icons.person_rounded,
                  iconBgColor: Colors.white.withOpacity(0.25),
                  iconColor: Colors.white,
                  title: 'My Self',
                  subtitle: 'Challenges, goals & investment',
                  isPrimary: false,
                ),
                const SizedBox(height: 36),
                Text(
                  'What you can do',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white.withOpacity(0.95),
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 20),
                const _ReferralDetailsCard(),
                const SizedBox(height: 16),
                const _FeaturesStrip(),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final VoidCallback onTap;
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;
  final String title;
  final String subtitle;
  final bool isPrimary;

  const _OptionCard({
    required this.onTap,
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.isPrimary,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          decoration: BoxDecoration(
            color: isPrimary ? Colors.white : Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(20),
            border: isPrimary ? null : Border.all(color: Colors.white.withOpacity(0.6), width: 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(isPrimary ? 0.12 : 0.06),
                blurRadius: isPrimary ? 16 : 12,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isPrimary ? primary.withOpacity(0.12) : iconBgColor,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, size: 32, color: isPrimary ? primary : iconColor),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: isPrimary ? primary : Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: isPrimary ? primary.withOpacity(0.8) : Colors.white.withOpacity(0.85),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 18,
                color: isPrimary ? primary : Colors.white70,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReferralDetailsCard extends StatelessWidget {
  const _ReferralDetailsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.18),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.4), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.people_rounded, size: 28, color: Colors.white),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Refer & Earn',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Colors.white.withOpacity(0.98),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Share your email when friends sign up. You earn 2% of their first investment amount after admin approval. View earnings in My Self → Refer & Earn.',
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.35,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeaturesStrip extends StatelessWidget {
  const _FeaturesStrip();

  static const List<({IconData icon, String label})> _features = [
    (icon: Icons.login_rounded, label: 'Clock in'),
    (icon: Icons.calendar_today_rounded, label: 'Leaves'),
    (icon: Icons.track_changes_rounded, label: 'Challenges'),
    (icon: Icons.savings_rounded, label: 'Investment'),
    (icon: Icons.people_rounded, label: 'Refer & Earn'),
    (icon: Icons.insights_rounded, label: 'Reports'),
    (icon: Icons.person_rounded, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.15,
      children: _features.map((f) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.18),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white.withOpacity(0.35), width: 1.2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.06),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(f.icon, size: 28, color: Colors.white),
              const SizedBox(height: 8),
              Text(
                f.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withOpacity(0.95),
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
