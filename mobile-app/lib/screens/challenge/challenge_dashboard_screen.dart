import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/challenge_auth_provider.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:timesheet_mobile/screens/challenge/create_challenge_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_detail_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_reports_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_profile_screen.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_settings_screen.dart';
import 'package:timesheet_mobile/services/investment_api_service.dart';
import 'package:timesheet_mobile/services/notification_service.dart';
import 'package:timesheet_mobile/screens/investment/investment_dashboard_screen.dart';
import 'package:timesheet_mobile/screens/investment/investment_theme.dart';
import 'package:timesheet_mobile/screens/investment/referral_screen.dart';
import 'package:timesheet_mobile/screens/splash_screen.dart';
import 'package:intl/intl.dart';

String _formatDate(String? dateStr, {bool short = false}) {
  if (dateStr == null || dateStr.isEmpty) return '—';
  try {
    final d = DateTime.parse(dateStr).toLocal();
    return short
        ? DateFormat('MMM d, yyyy').format(d)
        : DateFormat('EEE, MMM d').format(d);
  } catch (_) {
    return dateStr;
  }
}

class ChallengeDashboardScreen extends StatefulWidget {
  const ChallengeDashboardScreen({super.key});

  @override
  State<ChallengeDashboardScreen> createState() => _ChallengeDashboardScreenState();
}

class _ChallengeDashboardScreenState extends State<ChallengeDashboardScreen> {
  final ChallengeApiService _api = ChallengeApiService();
  final InvestmentApiService _investmentApi = InvestmentApiService();
  Map<String, dynamic>? _data;
  Map<String, dynamic>? _referralStats;
  bool _loading = true;
  String? _error;
  bool _challengesReminderPopupShown = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      // Use investment dashboard for referral approved/pending (same source as withdrawable balance).
      final data = await _api.getDashboard();
      Map<String, dynamic>? referralStats;
      try {
        final invDashboard = await _investmentApi.getDashboard();
        final approved = invDashboard['referral_balance_approved'];
        final pending = invDashboard['referral_balance_pending'];
        referralStats = {
          'referral_balance_approved': _toNum(approved),
          'referral_balance_pending': _toNum(pending),
          'total_referrals': _toNum(invDashboard['total_referrals']),
        };
      } catch (_) {
        try {
          final stats = await _investmentApi.getReferralStats();
          referralStats = {
            'referral_balance_approved': _toNum(stats['referral_balance_approved']),
            'referral_balance_pending': _toNum(stats['referral_balance_pending']),
            'total_referrals': _toNum(stats['total_referrals']),
          };
        } catch (_) {
          referralStats = null;
        }
      }
      if (mounted) setState(() {
        _data = data;
        _referralStats = referralStats;
        _loading = false;
      });
      // Request permission so challenge reminders fire when app is closed (Android exact alarm)
      await NotificationService.requestReminderPermissions();
      // Schedule task reminder alarms at each challenge's reminder time (works when app is closed)
      final activeList = data['active_challenges'] as List? ?? [];
      await NotificationService.scheduleChallengeTaskReminders(activeList);
      // Show challenges reminder popup once after login when dashboard loads
      if (mounted && !_challengesReminderPopupShown) {
        _challengesReminderPopupShown = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _showChallengesReminderPopup();
        });
      }
    } catch (e) {
      // 401 is handled by ChallengeApiService: session cleared and redirect to login with popup
      final isSessionExpired = e is SessionExpiredException ||
          (e is DioException && e.error is SessionExpiredException);
      if (isSessionExpired) {
        if (mounted) setState(() => _loading = false);
        return;
      }
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  double _toNum(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v.toDouble();
    if (v is double) return v;
    return double.tryParse(v.toString()) ?? 0;
  }

  void _showChallengesReminderPopup() {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.track_changes_rounded, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            const Text('Challenges reminder'),
          ],
        ),
        content: const Text(
          'Don\'t forget to complete your daily challenges today! Stay on track with your goals.',
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<ChallengeAuthProvider>().user;
    final name = (user?['name'] ?? user?['email'] ?? 'User').toString();
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    final kycStatus = _data?['kyc_status']?.toString();
    final isVerified = kycStatus == 'VERIFIED';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => Navigator.pop(context),
                tooltip: 'Back to Time Sheet',
              )
            : IconButton(
                icon: const Icon(Icons.person_rounded),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeProfileScreen())).then((_) => _load()),
                tooltip: 'Profile',
              ),
        title: Text(
          'Hello, $name!',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
        ),
        centerTitle: false,
        backgroundColor: primary,
        foregroundColor: Colors.white,
        actions: [
          if (Navigator.canPop(context))
            IconButton(
              icon: const Icon(Icons.person_rounded),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeProfileScreen())).then((_) => _load()),
              tooltip: 'Profile',
            ),
          Center(
            child: Padding(
              padding: const EdgeInsets.only(right: 8),
              child: GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeProfileScreen())).then((_) => _load()),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isVerified ? InvestmentTheme.kSuccess.withOpacity(0.2) : Colors.orange.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isVerified ? 'Verified' : 'Not verified',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isVerified ? InvestmentTheme.kSuccess : Colors.orange.shade800,
                    ),
                  ),
                ),
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.insights_rounded),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeReportsScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.settings_rounded),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeSettingsScreen())),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white),
            onSelected: (v) async {
              if (v == 'logout') {
                await context.read<ChallengeAuthProvider>().logout();
                if (!mounted) return;
                Navigator.of(context).pushAndRemoveUntil(MaterialPageRoute(builder: (_) => const SplashScreen()), (route) => false);
              }
            },
            itemBuilder: (_) => [const PopupMenuItem(value: 'logout', child: Text('Log out'))],
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // _buildWelcomeCard(name, primary),
                        // const SizedBox(height: 20),
                        _buildInvestmentCard(primary),
                        const SizedBox(height: 12),
                        _buildReferAndEarnCard(primary),
                        const SizedBox(height: 20),
                        _buildSummarySection(),
                        const SizedBox(height: 20),
                        _buildTodaySection(),
                        const SizedBox(height: 20),
                        _buildActiveChallenges(),
                        const SizedBox(height: 20),
                        _buildOverallChart(),
                        if ((_data?['missed_tasks'] as List?)?.isNotEmpty == true) ...[
                          const SizedBox(height: 20),
                          _buildMissedSection(),
                        ],
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateChallengeScreen())).then((_) => _load()),
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Challenge'),
        backgroundColor: primary,
        elevation: 4,
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 64, color: Colors.grey.shade400),
            const SizedBox(height: 16),
            Text(_error!, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14)),
            const SizedBox(height: 20),
            FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  Widget _buildInvestmentCard(Color primary) {
    final inv = _data?['investment_summary'] as Map<String, dynamic>?;
    final kycVerified = _data?['kyc_status']?.toString() == 'VERIFIED';
    final totalInvested = (inv != null ? double.tryParse(inv['total_invested']?.toString() ?? '') : null) ?? 0.0;
    final totalEarnings = (inv != null ? double.tryParse(inv['total_earnings']?.toString() ?? '') : null) ?? 0.0;
    final upcoming = inv?['upcoming_maturity'] as List? ?? [];
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    const investedBlue = InvestmentTheme.kPrimary;
    const earningsGreen = InvestmentTheme.kSuccess;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvestmentDashboardScreen())),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4)),
              BoxShadow(color: primary.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, 4)),
            ],
            border: Border.all(color: primary.withOpacity(0.25)),
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: [primary.withOpacity(0.06), Colors.white, Colors.white],
              stops: const [0.0, 0.08, 1.0],
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [primary.withOpacity(0.25), primary.withOpacity(0.12)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: primary.withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 2))],
                ),
                child: Icon(Icons.savings_rounded, color: primary, size: 32),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Investment', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    if (kycVerified)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: RichText(
                          text: TextSpan(
                            style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                            children: [
                              const TextSpan(text: 'Total invested: '),
                              TextSpan(text: format.format(totalInvested), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: investedBlue)),
                              TextSpan(text: ' • Total earnings: ', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
                              TextSpan(text: format.format(totalEarnings), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: earningsGreen)),
                            ],
                          ),
                        ),
                      )
                    else
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text('Invest & earn interest • KYC once', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                      ),
                    if (upcoming.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 6),
                        child: Text('${upcoming.length} upcoming maturity', style: InvestmentTheme.dateHighlight(fontSize: 13)),
                      ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: primary.withOpacity(0.7)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReferAndEarnCard(Color primary) {
    final format = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final formatDecimals = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
    final approved = (double.tryParse(_referralStats?['referral_balance_approved']?.toString() ?? '') ?? 0);
    final pending = (double.tryParse(_referralStats?['referral_balance_pending']?.toString() ?? '') ?? 0);
    final approvedStr = approved >= 1 ? format.format(approved) : formatDecimals.format(approved);
    final pendingStr = pending >= 1 ? format.format(pending) : formatDecimals.format(pending);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReferralScreen())).then((_) => _load()),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: primary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: primary.withOpacity(0.12)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 2))],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: primary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(Icons.people_rounded, color: primary, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Refer & Earn', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      "2% of friend's first investment.",
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                    ),
                    Text(
                      'Approved: $approvedStr • Pending: $pendingStr',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: primary),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right_rounded, color: Colors.grey.shade600),
            ],
          ),
        ),
      ),
    );
  }

  // Widget _buildWelcomeCard(String name, Color primary) {
  //   return Container(
  //     width: double.infinity,
  //     padding: const EdgeInsets.all(20),
  //     decoration: BoxDecoration(
  //       gradient: LinearGradient(
  //         begin: Alignment.topLeft,
  //         end: Alignment.bottomRight,
  //         colors: [primary, primary.withOpacity(0.85)],
  //       ),
  //       borderRadius: BorderRadius.circular(20),
  //       boxShadow: [BoxShadow(color: primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
  //     ),
  //     child: Column(
  //       crossAxisAlignment: CrossAxisAlignment.start,
  //       children: [
  //         Text('Hello, $name!', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
  //         const SizedBox(height: 4),
  //         Text("Here's your progress today.", style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14)),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildSummarySection() {
    final overall = _data?['overall'] as Map<String, dynamic>? ?? {};
    final active = (overall['active_challenges'] ?? 0) as int;
    final completed = (overall['total_completed_days'] ?? 0) as int;
    final missed = (overall['total_missed_days'] ?? 0) as int;
    // Progress = completed days out of total expected days across all active challenges (includes pending)
    final list = _data?['active_challenges'] as List? ?? [];
    int totalExpectedDays = 0;
    for (final c in list) {
      totalExpectedDays += (c['total_days'] ?? 0) as int;
    }
    final progressPercent = totalExpectedDays > 0
        ? (completed / totalExpectedDays * 100).round()
        : (completed + missed > 0 ? (completed / (completed + missed) * 100).round() : 0);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics_rounded, color: Theme.of(context).colorScheme.primary, size: 22),
              const SizedBox(width: 8),
              Text('Monthly summary', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _summaryChip('Challenges', active.toString(), Icons.track_changes_rounded, const Color(0xFF6366F1)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryChip('Completed', completed.toString(), Icons.check_circle_rounded, InvestmentTheme.kSuccess),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _summaryChip('Missed', missed.toString(), Icons.schedule_rounded, InvestmentTheme.kAccent),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text('Progress', style: TextStyle(fontSize: 13, color: Colors.grey.shade700)),
          const SizedBox(height: 6),
          LinearProgressIndicator(
            value: progressPercent / 100,
            backgroundColor: Colors.grey.shade200,
            valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
            minHeight: 8,
            borderRadius: BorderRadius.circular(4),
          ),
          const SizedBox(height: 4),
          Text('$progressPercent%', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
        ],
      ),
    );
  }

  Widget _summaryChip(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, size: 22, color: color),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
          Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
        ],
      ),
    );
  }

  Widget _buildTodaySection() {
    final todos = _data?['today_todos'] as List? ?? [];
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.calendar_today_rounded, color: Theme.of(context).colorScheme.primary, size: 22),
              const SizedBox(width: 8),
              Text("Today's tasks", style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          if (todos.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('No tasks due today. Add a challenge or enjoy your day!', style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
            )
          else
            ...todos.map<Widget>((t) {
              final day = t['day'] as Map<String, dynamic>?;
              final dayId = day?['id']?.toString();
              final title = t['challenge_title']?.toString() ?? 'Challenge';
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                subtitle: Text('Day ${day?['day_number'] ?? ''}', style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                trailing: day?['status'] == 'pending'
                    ? FilledButton(
                        onPressed: dayId != null
                            ? () async {
                                try {
                                  await _api.markDayComplete(dayId);
                                  _load();
                                } catch (_) {}
                              }
                            : null,
                        child: const Text('Complete'),
                      )
                    : Icon(Icons.check_circle_rounded, color: InvestmentTheme.kSuccess, size: 24),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildActiveChallenges() {
    final list = _data?['active_challenges'] as List? ?? [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Active challenges', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            if (list.isNotEmpty)
              TextButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeReportsScreen())),
                child: Text('${list.length} challenges', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (list.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Text('No active challenges. Tap + New Challenge to start.', style: TextStyle(color: Colors.grey.shade600)),
          )
        else
          ...list.take(5).map((c) {
            final id = c['id']?.toString();
            final title = c['challenge_title'] ?? c['title'] ?? '';
            final completed = (c['completed_days'] ?? 0) as int;
            final total = (c['total_days'] ?? 0) as int;
            final percent = total > 0 ? (completed / total * 100).round() : 0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: id != null ? () => _openChallenge(id) : null,
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(title.toString(), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                              const SizedBox(height: 6),
                              LinearProgressIndicator(
                                value: total > 0 ? completed / total : 0,
                                backgroundColor: Colors.grey.shade200,
                                valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                                minHeight: 6,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              const SizedBox(height: 4),
                              Text('$completed / $total days · $percent%', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }

  Widget _buildOverallChart() {
    final list = _data?['active_challenges'] as List? ?? [];
    final todayTodos = _data?['today_todos'] as List? ?? [];
    if (list.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Upcoming', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(
            children: [
              if (todayTodos.isNotEmpty)
                ...todayTodos.take(5).map((t) {
                  final chId = t['challenge_id']?.toString();
                  final title = t['challenge_title']?.toString() ?? '';
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                    trailing: const Icon(Icons.chevron_right_rounded, color: Colors.grey),
                    onTap: chId != null ? () => _openChallenge(chId) : null,
                  );
                })
              else
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text('No tasks due today. Add a challenge or enjoy your day!', style: TextStyle(color: Colors.grey.shade600, fontSize: 14)),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMissedSection() {
    final missed = _data?['missed_tasks'] as List? ?? [];
    if (missed.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Missed', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: Colors.orange.shade800)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.orange.shade200),
          ),
          child: Column(
            children: missed.take(5).map<Widget>((m) {
              final chId = m['challenge_id']?.toString();
              final title = m['challenge_title']?.toString() ?? 'Challenge';
              final date = m['date']?.toString();
              return ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(title),
                subtitle: date != null ? Text(_formatDate(date, short: true), style: TextStyle(fontSize: 12, color: Colors.grey.shade600)) : null,
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: chId != null ? () => _openChallenge(chId) : null,
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  void _openChallenge(dynamic id) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => ChallengeDetailScreen(challengeId: id.toString()))).then((_) => _load());
  }
}
