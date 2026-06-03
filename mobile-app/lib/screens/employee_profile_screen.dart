import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/screens/login_screen.dart';
import 'package:timesheet_mobile/screens/employee_my_payslips_screen.dart';
import 'package:timesheet_mobile/screens/investment/update_kyc_status_screen.dart';
import 'package:timesheet_mobile/utils/app_config.dart';

class EmployeeProfileScreen extends StatelessWidget {
  const EmployeeProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          final user = authProvider.user;
          if (user == null) {
            return const Center(child: Text('No user data available'));
          }

          final displayName = AppConfig.displayNameForUser(user);
          final photoUrl = AppConfig.employeePhotoUrlFromFilename(user['employeeImage']);
          final initial = displayName.isNotEmpty && displayName != 'Employee'
              ? displayName[0].toUpperCase()
              : 'E';

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 60,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: photoUrl != null
                      ? ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: photoUrl,
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => const SizedBox(
                              width: 32,
                              height: 32,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            ),
                            errorWidget: (_, __, ___) => Text(
                              initial,
                              style: const TextStyle(fontSize: 48, color: Colors.white),
                            ),
                          ),
                        )
                      : Text(
                          initial,
                          style: const TextStyle(fontSize: 48, color: Colors.white),
                        ),
                ),
                const SizedBox(height: 16),
                Text(
                  displayName,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                Text(
                  user['EMPID']?.toString() ?? user['employeeId']?.toString() ?? '',
                  style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                ),
                const SizedBox(height: 32),
                // Profile Details
                Card(
                  child: Column(
                    children: [
                      _buildProfileItem(
                        context,
                        'Full Name',
                        user['employeeName']?.toString().trim().isNotEmpty == true
                            ? user['employeeName']!.toString()
                            : displayName,
                        Icons.person,
                      ),
                      const Divider(),
                      _buildProfileItem(
                        context,
                        'Email',
                        user['userName']?.toString() ?? 'N/A',
                        Icons.email,
                      ),
                      const Divider(),
                      _buildProfileItem(
                        context,
                        'Employee ID',
                        user['EMPID']?.toString() ?? user['employeeId']?.toString() ?? 'N/A',
                        Icons.badge,
                      ),
                      const Divider(),
                      _buildProfileItem(
                        context,
                        'Role',
                        user['role']?.toString() ?? 'N/A',
                        Icons.work,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: Icon(
                          Icons.account_balance_wallet,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        title: const Text('My Payslips & Salary'),
                        subtitle: const Text(
                          'View pay period details and download paid salary slips',
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const EmployeeMyPayslipsScreen()),
                        ),
                      ),
                      if ((user['role']?.toString().toLowerCase() ?? '') == 'admin') ...[
                        const Divider(height: 1),
                        ListTile(
                          leading: Icon(Icons.verified_user, color: Theme.of(context).colorScheme.primary),
                          title: const Text('Update KYC Status'),
                          subtitle: const Text('Admin: set KYC status for investment users'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const UpdateKycStatusScreen()),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                // Logout Button
                Card(
                  child: InkWell(
                    onTap: () async {
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

                      if (confirm == true && context.mounted) {
                        final authProvider = Provider.of<AuthProvider>(context, listen: false);
                        await authProvider.logout();
                        if (context.mounted) {
                          Navigator.of(context).pushAndRemoveUntil(
                            MaterialPageRoute(builder: (_) => LoginScreen()),
                            (route) => false,
                          );
                        }
                      }
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.logout, color: Colors.red),
                          SizedBox(width: 8),
                          Text(
                            'Logout',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.red,
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
        },
      ),
    );
  }

  Widget _buildProfileItem(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
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

