import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:fl_chart/fl_chart.dart';

class ChallengeReportsScreen extends StatefulWidget {
  const ChallengeReportsScreen({super.key});

  @override
  State<ChallengeReportsScreen> createState() => _ChallengeReportsScreenState();
}

class _ChallengeReportsScreenState extends State<ChallengeReportsScreen> {
  final ChallengeApiService _api = ChallengeApiService();
  Map<String, dynamic>? _report;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.getReports();
      if (mounted) setState(() { _report = data; _loading = false; });
    } catch (e) {
      final isSessionExpired = e is SessionExpiredException ||
          (e is DioException && e.error is SessionExpiredException);
      if (isSessionExpired && mounted) setState(() => _loading = false);
      else if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_error != null) return _buildError();

    final challenges = _report!['challenges'] as List? ?? [];
    final streak = _report!['streak'] as Map<String, dynamic>? ?? {};
    final successRate = (_report!['challenge_success_rate'] ?? 0) as num;
    final totalActive = (_report!['total_active'] ?? 0) as int;
    final totalCompleted = (_report!['total_completed'] ?? 0) as int;
    final longestStreak = (streak['longest'] ?? 0) as int;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        title: const Text('Reports', style: TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSummaryCard(successRate.toDouble(), longestStreak, totalActive, totalCompleted),
              const SizedBox(height: 20),
              _buildSuccessRateChart(successRate.toDouble()),
              if (challenges.isNotEmpty) ...[
                const SizedBox(height: 24),
                _buildSectionTitle('Goal vs actual'),
                const SizedBox(height: 12),
                _buildGoalVsActualBars(challenges),
                const SizedBox(height: 24),
                _buildSectionTitle('Challenge breakdown'),
                const SizedBox(height: 8),
                _buildChallengeList(challenges),
              ],
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline_rounded, size: 64, color: Colors.grey.shade400),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              FilledButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Row(
      children: [
        Icon(Icons.analytics_rounded, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildSummaryCard(double successRate, int longestStreak, int totalActive, int totalCompleted) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primary.withOpacity(0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Theme.of(context).colorScheme.primary.withOpacity(0.3), blurRadius: 12, offset: const Offset(0, 6))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Summary', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _whiteStat('Success rate', '${successRate.round()}%', Icons.percent_rounded)),
              Expanded(child: _whiteStat('Longest streak', '$longestStreak days', Icons.local_fire_department_rounded)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _whiteStat('Active', '$totalActive', Icons.track_changes_rounded)),
              Expanded(child: _whiteStat('Completed', '$totalCompleted', Icons.check_circle_rounded)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _whiteStat(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 22),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildSuccessRateChart(double percent) {
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
              Icon(Icons.pie_chart_rounded, color: Theme.of(context).colorScheme.primary, size: 20),
              const SizedBox(width: 8),
              const Text('Challenge success rate', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 140,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 140,
                  height: 140,
                  child: CircularProgressIndicator(
                    value: (percent / 100).clamp(0.0, 1.0),
                    strokeWidth: 14,
                    backgroundColor: Colors.grey.shade200,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('${percent.round()}%', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF22C55E))),
                    Text('success', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoalVsActualBars(List<dynamic> challenges) {
    final bars = challenges.take(8).toList();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          ...bars.map<Widget>((c) {
            final ch = c as Map<String, dynamic>;
            final title = ch['title'] as String? ?? '';
            final goal = ch['total_days'] as int? ?? 0;
            final actual = ch['completed_days'] as int? ?? 0;
            final pct = goal > 0 ? (actual / goal).clamp(0.0, 1.0) : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
                      Text('$actual / $goal', style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 10,
                      backgroundColor: Colors.green.shade100,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildChallengeList(List<dynamic> challenges) {
    return Column(
      children: challenges.map<Widget>((c) {
        final ch = c as Map<String, dynamic>;
        final percent = ch['completion_percent'] ?? 0;
        final success = ch['success'] == true;
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: success ? const Color(0xFF22C55E).withOpacity(0.15) : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  success ? Icons.emoji_events_rounded : Icons.track_changes_rounded,
                  color: success ? const Color(0xFF22C55E) : Colors.grey,
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ch['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    Text(
                      '${ch['completed_days']}/${ch['total_days']} days • $percent%${success ? ' • Success' : ''}',
                      style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
              Text('$percent%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: success ? const Color(0xFF22C55E) : Theme.of(context).colorScheme.primary)),
            ],
          ),
        );
      }).toList(),
    );
  }
}
