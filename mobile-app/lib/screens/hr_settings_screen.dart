import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/screens/hr_settings_discipline_screen.dart';
import 'package:timesheet_mobile/screens/hr_settings_designation_screen.dart';
import 'package:timesheet_mobile/screens/hr_settings_areaofwork_screen.dart';
import 'package:timesheet_mobile/screens/hr_settings_variation_screen.dart';

class HrSettingsScreen extends StatelessWidget {
  const HrSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSettingsCard(
            context,
            'Discipline Management',
            'Manage employee disciplines',
            Icons.school,
            Colors.blue,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HrSettingsDisciplineScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingsCard(
            context,
            'Designation Management',
            'Manage employee designations',
            Icons.work,
            Colors.green,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HrSettingsDesignationScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingsCard(
            context,
            'Area of Work Management',
            'Manage areas of work',
            Icons.engineering,
            Colors.orange,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HrSettingsAreaOfWorkScreen()),
            ),
          ),
          const SizedBox(height: 12),
          _buildSettingsCard(
            context,
            'Variation Management',
            'Manage project variations',
            Icons.change_circle,
            Colors.purple,
            () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const HrSettingsVariationScreen()),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsCard(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey[400]),
            ],
          ),
        ),
      ),
    );
  }
}
