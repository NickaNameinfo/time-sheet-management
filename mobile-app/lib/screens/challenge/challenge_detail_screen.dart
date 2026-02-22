import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:intl/intl.dart';

/// Format API date (yyyy-MM-dd) to short display e.g. "Feb 18"
String _formatDateShort(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return '—';
  try {
    final d = DateTime.parse(dateStr);
    return DateFormat('MMM d').format(d);
  } catch (_) {
    return dateStr;
  }
}

/// True if dateStr (yyyy-MM-dd) is today (local date).
bool _isToday(String? dateStr) {
  if (dateStr == null || dateStr.isEmpty) return false;
  try {
    final d = DateTime.parse(dateStr);
    final now = DateTime.now();
    return d.year == now.year && d.month == now.month && d.day == now.day;
  } catch (_) {
    return false;
  }
}

class ChallengeDetailScreen extends StatefulWidget {
  final String challengeId;

  const ChallengeDetailScreen({super.key, required this.challengeId});

  @override
  State<ChallengeDetailScreen> createState() => _ChallengeDetailScreenState();
}

class _ChallengeDetailScreenState extends State<ChallengeDetailScreen> {
  final ChallengeApiService _api = ChallengeApiService();
  Map<String, dynamic>? _data;
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
      final data = await _api.getChallenge(widget.challengeId);
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _markComplete(String dayId) async {
    try {
      await _api.markDayComplete(dayId);
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Marked as completed!'), backgroundColor: Color(0xFF22C55E), behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_error != null) return _buildError();

    final challenge = _data!['challenge'] as Map<String, dynamic>? ?? {};
    final days = _data!['days'] as List? ?? [];
    final completed = _data!['completed_days'] as int? ?? 0;
    final missed = _data!['missed_days'] as int? ?? 0;
    final total = challenge['total_days'] as int? ?? 0;
    final progress = total > 0 ? (completed / total * 100).round() : 0;
    final primary = Theme.of(context).colorScheme.primary;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        title: Text(challenge['title'] ?? 'Challenge', style: const TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: primary,
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
              if (challenge['description'] != null && (challenge['description'] as String).isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
                  ),
                  child: Text(challenge['description'] as String, style: TextStyle(fontSize: 14, color: Colors.grey.shade700, height: 1.4)),
                ),
              _buildProgressCard(completed, total, progress, missed),
              const SizedBox(height: 24),
              _buildSectionTitle('Daily progress'),
              const SizedBox(height: 12),
              _buildCalendarGrid(days),
              const SizedBox(height: 20),
              Text('Day details', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, color: Colors.grey.shade700)),
              const SizedBox(height: 10),
              _buildDayDetailsList(days),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Scaffold(
      appBar: AppBar(title: const Text('Challenge')),
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
        Icon(Icons.calendar_view_week_rounded, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildProgressCard(int completed, int total, int progress, int missed) {
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Progress', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              Text('$progress%', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF22C55E))),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: total > 0 ? (completed / total).clamp(0.0, 1.0) : 0,
              minHeight: 12,
              backgroundColor: Colors.grey.shade200,
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF22C55E)),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _miniChip('Done', completed.toString(), const Color(0xFF22C55E)),
              const SizedBox(width: 10),
              _miniChip('Missed', missed.toString(), Colors.red),
              const SizedBox(width: 10),
              _miniChip('Total', total.toString(), Colors.grey),
            ],
          ),
        ],
      ),
    );
  }

  Widget _miniChip(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(fontSize: 12, color: color.withOpacity(0.9))),
          const SizedBox(width: 4),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid(List<dynamic> days) {
    const columns = 7;
    final rows = <Widget>[];
    for (var i = 0; i < days.length; i += columns) {
      final rowDays = days.skip(i).take(columns).toList();
      rows.add(
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: List.generate(columns, (col) {
              if (col >= rowDays.length) {
                return const Expanded(child: SizedBox());
              }
              final d = rowDays[col] as Map<String, dynamic>;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: _dayCell(d),
                ),
              );
            }),
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Tap a pending day to mark it done', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          const SizedBox(height: 12),
          ...rows,
        ],
      ),
    );
  }

  Widget _buildDayDetailsList(List<dynamic> days) {
    return Column(
      children: days.map<Widget>((d) {
        final day = d as Map<String, dynamic>;
        final status = day['status'] ?? 'pending';
        final dayId = day['id']?.toString();
        final dateStr = day['date'] ?? '';
        final dayName = day['day_name'] ?? '';
        final dayNum = day['day_number'] ?? 0;
        final completedAt = day['completed_at']?.toString();
        final isPending = status == 'pending';
        final isCompleted = status == 'completed';
        final isMissed = status == 'missed';

        String statusLabel;
        Color statusColor;
        IconData statusIcon;
        if (isCompleted) {
          statusLabel = 'Completed';
          statusColor = const Color(0xFF22C55E);
          statusIcon = Icons.check_circle_rounded;
        } else if (isMissed) {
          statusLabel = 'Missed';
          statusColor = Colors.red;
          statusIcon = Icons.schedule_rounded;
        } else {
          statusLabel = 'Pending';
          statusColor = Colors.grey;
          statusIcon = Icons.radio_button_unchecked_rounded;
        }

        String? completedTimeStr;
        if (completedAt != null && completedAt.isNotEmpty) {
          try {
            final dt = DateTime.parse(completedAt);
            completedTimeStr = DateFormat('MMM d, HH:mm').format(dt);
          } catch (_) {}
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: isCompleted ? const Color(0xFF22C55E).withOpacity(0.3) : (isMissed ? Colors.red.withOpacity(0.3) : Colors.grey.shade300)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 2))],
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(statusIcon, color: statusColor, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Day $dayNum • $dayName',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatDateShort(dateStr),
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                    ),
                    if (completedTimeStr != null) ...[
                      const SizedBox(height: 2),
                      Text('Done at $completedTimeStr', style: TextStyle(fontSize: 11, color: statusColor, fontStyle: FontStyle.italic)),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(statusLabel, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: statusColor)),
                  ),
                  if (isPending && dayId != null) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _isToday(dateStr) ? () => _markComplete(dayId) : null,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(_isToday(dateStr) ? 'Mark done' : 'Not today'),
                    ),
                  ],
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _dayCell(Map<String, dynamic> day) {
    final status = day['status'] ?? 'pending';
    final dayId = day['id']?.toString();
    final dateStr = day['date'] ?? '';
    final dayNum = day['day_number'] ?? 0;
    final isPending = status == 'pending';
    final isCompleted = status == 'completed';
    final isMissed = status == 'missed';
    final isToday = _isToday(dateStr);

    Color bgColor;
    IconData? icon;
    if (isCompleted) {
      bgColor = const Color(0xFF22C55E).withOpacity(0.2);
      icon = Icons.check_rounded;
    } else if (isMissed) {
      bgColor = Colors.red.shade100;
      icon = Icons.close_rounded;
    } else {
      bgColor = Colors.grey.shade200;
      icon = null;
    }

    final canTap = isPending && dayId != null && isToday;

    return InkWell(
      onTap: canTap ? () => _markComplete(dayId) : null,
      borderRadius: BorderRadius.circular(10),
      child: Opacity(
        opacity: isPending && !isToday ? 0.6 : 1,
        child: Container(
          height: 44,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(10),
            border: isPending ? Border.all(color: isToday ? Colors.green.shade400 : Colors.grey.shade400, width: 1) : null,
          ),
          child: Center(
            child: icon != null
                ? Icon(icon, size: 20, color: isCompleted ? const Color(0xFF22C55E) : Colors.red.shade700)
                : Text('$dayNum', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
          ),
        ),
      ),
    );
  }
}
