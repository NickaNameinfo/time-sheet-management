import 'package:flutter/material.dart';
import 'package:timesheet_mobile/screens/policies/policy_detail_screen.dart';

class PoliciesListScreen extends StatelessWidget {
  const PoliciesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final policies = PolicyType.values;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Legal & Policies'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: policies.length,
        itemBuilder: (context, index) {
          final type = policies[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.15),
                child: Icon(type.icon, color: Theme.of(context).colorScheme.primary),
              ),
              title: Text(
                type.title,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => PolicyDetailScreen(policyType: type),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
