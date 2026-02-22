import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:timesheet_mobile/screens/challenge/challenge_profile_screen.dart';
import 'package:timesheet_mobile/screens/policies/policies_list_screen.dart';
import 'package:timesheet_mobile/screens/splash_screen.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/challenge_auth_provider.dart';

class ChallengeSettingsScreen extends StatefulWidget {
  const ChallengeSettingsScreen({super.key});

  @override
  State<ChallengeSettingsScreen> createState() => _ChallengeSettingsScreenState();
}

class _ChallengeSettingsScreenState extends State<ChallengeSettingsScreen> {
  final ChallengeApiService _api = ChallengeApiService();
  bool _reminderEnabled = true;
  bool _eodReminderEnabled = true;
  bool _missedAlertEnabled = true;
  String _timezone = 'UTC';
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.getSettings();
      if (mounted) setState(() {
        _reminderEnabled = data['reminder_enabled'] == 1;
        _eodReminderEnabled = data['eod_reminder_enabled'] == 1;
        _missedAlertEnabled = data['missed_alert_enabled'] == 1;
        _timezone = data['timezone'] ?? 'UTC';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await _api.updateSettings(
        reminderEnabled: _reminderEnabled,
        eodReminderEnabled: _eodReminderEnabled,
        missedAlertEnabled: _missedAlertEnabled,
        timezone: _timezone,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        title: const Text('Settings', style: TextStyle(fontWeight: FontWeight.w600)),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          if (_saving)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))),
            )
          else
            TextButton(
              onPressed: _save,
              child: const Text('Save', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
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
                    Icon(Icons.notifications_rounded, color: Theme.of(context).colorScheme.primary, size: 22),
                    const SizedBox(width: 8),
                    const Text('Notifications', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                _settingsSwitch('Daily reminder', 'Remind at your chosen time', _reminderEnabled, (v) => setState(() => _reminderEnabled = v)),
                _settingsSwitch('End of day reminder', 'Remind if not completed by EOD', _eodReminderEnabled, (v) => setState(() => _eodReminderEnabled = v)),
                _settingsSwitch('Missed challenge alert', 'Notify when a day is marked missed', _missedAlertEnabled, (v) => setState(() => _missedAlertEnabled = v)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
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
                    Icon(Icons.info_outline_rounded, color: Theme.of(context).colorScheme.primary, size: 22),
                    const SizedBox(width: 8),
                    const Text('Other', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.person_rounded, color: Theme.of(context).colorScheme.primary),
                  title: const Text('Profile & verification'),
                  subtitle: Text('View status and update verification document', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChallengeProfileScreen())),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Timezone'),
                  subtitle: Text(_timezone, style: TextStyle(color: Colors.grey.shade600)),
                ),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(Icons.gavel_rounded, color: Theme.of(context).colorScheme.primary),
                  title: const Text('Legal & Policies'),
                  subtitle: Text('Privacy, Terms, Payment, GST & more', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                  trailing: const Icon(Icons.chevron_right_rounded),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const PoliciesListScreen()),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: Colors.red),
              title: const Text('Delete account', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
              onTap: () async {
                final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Delete account?'),
                  content: const Text('All your challenges and data will be permanently deleted. This cannot be undone.'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                    TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
                  ],
                ),
                );
                if (confirm != true) return;
                try {
                  await _api.deleteAccount();
                  if (!mounted) return;
                  await context.read<ChallengeAuthProvider>().logout();
                  if (!mounted) return;
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const SplashScreen()),
                    (route) => false,
                  );
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString().replaceFirst('Exception: ', '')), backgroundColor: Colors.red, behavior: SnackBarBehavior.floating),
                    );
                  }
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _settingsSwitch(String title, String subtitle, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
                Text(subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
              ],
            ),
          ),
          Switch(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}
