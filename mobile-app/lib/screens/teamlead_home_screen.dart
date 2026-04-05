import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/theme/app_brand_colors.dart';
import 'package:intl/intl.dart';

class TeamLeadHomeScreen extends StatefulWidget {
  const TeamLeadHomeScreen({super.key});

  @override
  State<TeamLeadHomeScreen> createState() => _TeamLeadHomeScreenState();
}

class _TeamLeadHomeScreenState extends State<TeamLeadHomeScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _projects = [];
  List<dynamic> _workDetails = [];
  Map<String, double> _projectHours = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final teamLeadName = user['tlName']?.toString() ?? user['leadName']?.toString() ?? user['employeeName']?.toString() ?? '';

      // Load projects assigned to this team lead
      final projects = await _apiService.getProjects();
      final filteredProjects = projects.where((p) {
        final tlName = p['tlName']?.toString() ?? p['tlID']?.toString() ?? '';
        return tlName == teamLeadName || tlName == user['id']?.toString();
      }).toList();

      // Load work details
      final workDetails = await _apiService.getWorkDetails();

      // Calculate project hours
      final projectHours = <String, double>{};
      for (final project in filteredProjects) {
        final projectName = project['projectName']?.toString() ?? '';
        final projectWorkDetails = workDetails.where((w) {
          return w['projectName']?.toString() == projectName;
        }).toList();

        double totalHours = 0;
        for (final work in projectWorkDetails) {
          final hours = double.tryParse(work['totalHours']?.toString() ?? '0') ?? 0;
          totalHours += hours;
        }
        projectHours[projectName] = totalHours;
      }

      setState(() {
        _projects = filteredProjects;
        _workDetails = workDetails;
        _projectHours = projectHours;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Card
            Consumer<AuthProvider>(
              builder: (context, authProvider, _) {
                final user = authProvider.user;
                return Card(
                  elevation: 4,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: AppBrandColors.heroGradient,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Welcome Back',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.white70,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                user?['tlName'] ?? user?['leadName'] ?? user?['employeeName'] ?? 'Team Lead',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.groups,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            // Stats Cards
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Total Projects',
                    '${_projects.length}',
                    Icons.folder,
                    Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Team Members',
                    '${_workDetails.map((w) => w['employeeName']).toSet().length}',
                    Icons.people,
                    Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Projects List
            const Text(
              'Assigned Projects',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _projects.isEmpty
                ? const Center(child: Text('No projects assigned'))
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _projects.length,
                    itemBuilder: (context, index) {
                      final project = _projects[index];
                      final projectName = project['projectName']?.toString() ?? '';
                      final totalHours = _projectHours[projectName] ?? 0.0;
                      final allottedHours = double.tryParse(project['allotatedHours']?.toString() ?? '0') ?? 0.0;
                      final completion = allottedHours > 0 ? (totalHours / allottedHours * 100).clamp(0, 100) : 0.0;

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      projectName,
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  Chip(
                                    label: Text('${completion.toStringAsFixed(1)}%'),
                                    backgroundColor: completion >= 100 ? Colors.green : Colors.orange,
                                    labelStyle: const TextStyle(color: Colors.white),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              _buildProjectInfo('Reference No', project['referenceNo']?.toString() ?? 'N/A'),
                              _buildProjectInfo('Task No', project['taskJobNo']?.toString() ?? 'N/A'),
                              _buildProjectInfo('Allotted Hours', allottedHours.toStringAsFixed(2)),
                              _buildProjectInfo('Consumed Hours', totalHours.toStringAsFixed(2)),
                              const SizedBox(height: 8),
                              LinearProgressIndicator(
                                value: completion / 100,
                                backgroundColor: Colors.grey[300],
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  completion >= 100 ? Colors.green : Colors.blue,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProjectInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

