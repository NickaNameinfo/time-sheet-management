import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';
import 'package:intl/intl.dart';

class EmployeeTimeManagementScreen extends StatefulWidget {
  const EmployeeTimeManagementScreen({super.key});

  @override
  State<EmployeeTimeManagementScreen> createState() => _EmployeeTimeManagementScreenState();
}

class _EmployeeTimeManagementScreenState extends State<EmployeeTimeManagementScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = false;
  List<dynamic> _projects = [];
  List<dynamic> _workDetails = [];
  List<dynamic> _leaveDetails = [];
  List<dynamic> _areaOfWork = [];
  List<dynamic> _variations = [];
  int? _selectedWeek;
  List<String> _weekDates = [];
  List<Map<String, dynamic>> _formData = [];
  Map<int, Map<String, String>> _errorMessages = {};
  Map<int, Map<String, bool>> _isDisabled = {};
  int _totalMinutes = 0;

  @override
  void initState() {
    super.initState();
    _selectedWeek = _getCurrentWeekNumber();
    _loadData();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  int _getCurrentWeekNumber() {
    final now = DateTime.now();
    final startOfYear = DateTime(now.year, 1, 1);
    final daysSinceStart = now.difference(startOfYear).inDays;
    // Match backend calculation: Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7)
    // startOfYear.weekday returns 1-7 (Monday=1, Sunday=7), but we need 0-6 (Sunday=0)
    final dayOfWeek = startOfYear.weekday % 7; // Convert to 0-6 format (Sunday=0)
    return ((daysSinceStart + dayOfWeek + 1) / 7).ceil();
  }

  List<String> _getWeekDates(int weekNumber, int year) {
    final startDate = DateTime(year, 1, 1);
    final day = startDate.weekday;
    final diff = startDate.day - day + (day == 0 ? 1 : 1);
    final weekStart = DateTime(startDate.year, startDate.month, diff);
    final daysToAdd = (weekNumber - 1) * 7;
    final dates = <String>[];
    for (int i = 0; i < 7; i++) {
      final date = weekStart.add(Duration(days: daysToAdd + i));
      dates.add(DateFormat('MM/dd/yyyy').format(date));
    }
    return dates;
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final employeeId = AppConfig.employeeDbIdForApi(user);

      // Load all data in parallel
      final results = await Future.wait([
        _apiService.getProjects(),
        _apiService.getWorkDetails(employeeId: employeeId),
        _apiService.getLeaveDetails(employeeId: employeeId),
        _apiService.getAreaOfWork(),
        _apiService.getVariations(),
      ]);

      setState(() {
        _projects = results[0] as List<dynamic>;
        _workDetails = results[1] as List<dynamic>;
        _leaveDetails = results[2] as List<dynamic>;
        _areaOfWork = results[3] as List<dynamic>;
        _variations = results[4] as List<dynamic>;
      });

      _initializeWeekData();
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

  void _initializeWeekData() {
    final currentWeek = _selectedWeek ?? _getCurrentWeekNumber();
    final currentYear = DateTime.now().year;
    _weekDates = _getWeekDates(currentWeek, currentYear);

    // Filter work details for selected week
    final filteredData = _workDetails.where((item) {
      final weekNum = int.tryParse(item['weekNumber']?.toString() ?? '0') ?? 0;
      final sentDate = item['sentDate'];
      if (sentDate == null) return false;
      final date = DateTime.tryParse(sentDate.toString());
      if (date == null) return false;
      return weekNum == currentWeek && date.year == currentYear;
    }).toList();

    if (filteredData.isNotEmpty) {
      _formData = filteredData.map((result) {
        return {
          'id': result['id'],
          'employeeName': result['employeeName']?.toString() ?? '',
          'referenceNo': result['referenceNo']?.toString() ?? '',
          'projectName': result['projectName']?.toString() ?? '',
          'projectNo': result['projectNo']?.toString() ?? '',
          'tlName': result['tlName']?.toString() ?? '',
          'taskNo': result['taskNo']?.toString() ?? '',
          'subDivisionList': result['subDivisionList']?.toString() ?? '',
          'areaofWork': result['areaofWork']?.toString() ?? '',
          'variation': result['variation']?.toString() ?? '',
          'subDivision': result['subDivision']?.toString() ?? '',
          'monday': result['monday']?.toString() ?? '',
          'tuesday': result['tuesday']?.toString() ?? '',
          'wednesday': result['wednesday']?.toString() ?? '',
          'thursday': result['thursday']?.toString() ?? '',
          'friday': result['friday']?.toString() ?? '',
          'saturday': result['saturday']?.toString() ?? '',
          'sunday': result['sunday']?.toString() ?? '',
          'totalHours': result['totalHours']?.toString() ?? '0.0',
          'sentDate': result['sentDate']?.toString(),
          'approvedDate': result['approvedDate']?.toString(),
          'status': result['status']?.toString() ?? '',
        };
      }).toList();
    } else {
      _formData = [];
    }
  }

  bool _isDateInLeave(String dateStr) {
    if (_leaveDetails.isEmpty) return false;
    try {
      final date = DateFormat('MM/dd/yyyy').parse(dateStr);
      final dateFormatted = DateFormat('yyyy-MM-dd').format(date);
      return _leaveDetails.any((item) {
        final leaveFrom = item['leaveFrom']?.toString();
        if (leaveFrom == null) return false;
        final leaveDate = DateTime.tryParse(leaveFrom);
        if (leaveDate == null) return false;
        return DateFormat('yyyy-MM-dd').format(leaveDate) == dateFormatted;
      });
    } catch (e) {
      return false;
    }
  }

  bool _isFieldDisabled(int index, bool hasId) {
    if (_isDisabled[index]?['disable'] == false) return false;
    return hasId;
  }

  bool _isDayDisabled(int dayIndex, int rowIndex, bool hasId) {
    if (dayIndex >= _weekDates.length) return true;
    if (_isDateInLeave(_weekDates[dayIndex])) return true;
    return _isFieldDisabled(rowIndex, hasId);
  }

  double _calculateTotalHours(Map<String, dynamic> rowData) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    int totalMinutes = 0;
    int totalHours = 0;

    for (final day in days) {
      final value = rowData[day]?.toString() ?? '';
      if (value.isEmpty) continue;

      if (value.contains('.')) {
        final numValue = double.tryParse(value) ?? 0;
        final parts = value.split('.');
        final decimalPart = parts.length > 1 ? parts[1] : '';
        final decimalAsNumber = double.tryParse('0.$decimalPart') ?? 0;
        final minutesFromDecimal = (decimalAsNumber * 60).round();

        if (decimalPart.length == 2 && 
            int.tryParse(decimalPart) != null && 
            int.parse(decimalPart) <= 59 && 
            minutesFromDecimal != int.parse(decimalPart)) {
          // Hours.minutes format (e.g., "8.30" = 8 hours 30 minutes)
          final wholeHours = int.tryParse(parts[0]) ?? 0;
          final minutes = int.tryParse(decimalPart) ?? 0;
          totalHours += wholeHours;
          totalMinutes += minutes;
        } else {
          // Decimal hours format (e.g., "8.5" = 8.5 hours)
          final wholeHours = numValue.floor();
          final decimalHours = numValue - wholeHours;
          final minutes = (decimalHours * 60).round();
          totalHours += wholeHours;
          totalMinutes += minutes;
        }
      } else {
        // Whole number of hours
        totalHours += int.tryParse(value) ?? 0;
      }
    }

    final additionalHours = totalMinutes ~/ 60;
    final remainingMinutes = totalMinutes % 60;
    _totalMinutes = remainingMinutes;

    return (totalHours + additionalHours).toDouble();
  }

  void _handleOnChange(String name, dynamic value, int index) {
    setState(() {
      if (index >= _formData.length) {
        _formData.add({});
      }

      if (name == 'referenceNo') {
        final project = _projects.firstWhere(
          (item) => item['referenceNo']?.toString() == value.toString(),
          orElse: () => {},
        );
        if (project.isNotEmpty) {
          _formData[index] = {
            ..._formData[index],
            'referenceNo': value.toString(),
            'projectName': project['projectName']?.toString() ?? '',
            'tlName': project['tlID']?.toString() ?? '',
            'taskNo': project['taskJobNo']?.toString() ?? '',
            'subDivisionList': project['subDivision']?.toString() ?? '',
            'projectNo': project['projectNo']?.toString() ?? '',
          };
        }
      } else {
        _formData[index] = {
          ..._formData[index],
          name: value.toString(),
        };
      }

      // Recalculate total hours
      if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].contains(name)) {
        final totalHours = _calculateTotalHours(_formData[index]);
        _formData[index]['totalHours'] = '$totalHours.${_totalMinutes.toString().padLeft(2, '0')}';
      }
    });
  }

  void _handleAddRow() {
    setState(() {
      _formData.add({
        'referenceNo': '',
        'projectName': '',
        'projectNo': '',
        'taskNo': '',
        'areaofWork': '',
        'variation': '',
        'subDivision': '',
        'monday': '',
        'tuesday': '',
        'wednesday': '',
        'thursday': '',
        'friday': '',
        'saturday': '',
        'sunday': '',
        'totalHours': '0.0',
        'status': '',
        'sentDate': '',
        'approvedDate': '',
      });
    });
  }

  void _handleDeleteRow(int index) {
    setState(() {
      _formData.removeAt(index);
      _errorMessages.remove(index);
      _isDisabled.remove(index);
    });
  }

  Map<String, String> _validateForm(int index) {
    final errors = <String, String>{};
    final row = _formData[index];

    if ((row['areaofWork']?.toString() ?? '').isEmpty) {
      errors['areaofWork'] = 'This field is required';
    }
    if ((row['referenceNo']?.toString() ?? '').isEmpty) {
      errors['referenceNo'] = 'This field is required';
    }
    final totalHours = double.tryParse(row['totalHours']?.toString() ?? '0') ?? 0;
    if (totalHours == 0) {
      errors['totalHours'] = 'Total work hours should not be 0';
    }

    return errors;
  }

  Future<void> _handleSubmit(int index) async {
    final errors = _validateForm(index);
    if (errors.isNotEmpty) {
      setState(() {
        _errorMessages[index] = errors;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill all required fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _errorMessages.remove(index);
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null) return;

      final row = _formData[index];
      final currentWeek = _selectedWeek ?? _getCurrentWeekNumber();

      final submitData = {
        ...row,
        'employeeName': user['employeeName'] ?? user['name'],
        'employeeNo': AppConfig.employeeDbIdForApi(user) ?? user['employeeId'],
        'userName': user['userName'],
        'sentDate': DateTime.now().toIso8601String(),
        'weekNumber': currentWeek.toString(),
        'discipline': user['discipline'],
        'designation': user['designation'],
      };

      submitData.remove('id');

      await _apiService.addWorkDetails(submitData);

      if (mounted) {
        setState(() {
          _isDisabled[index] = {'disable': true};
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Work details submitted successfully'),
            backgroundColor: Colors.green,
          ),
        );
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _getStatusChip(String? status) {
    final statusLower = status?.toLowerCase() ?? '';
    if (statusLower == 'approved') {
      return Chip(
        avatar: const Icon(Icons.check_circle, size: 18, color: Colors.white),
        label: const Text('Approved'),
        backgroundColor: Colors.green,
        labelStyle: const TextStyle(color: Colors.white),
      );
    } else if (statusLower == 'rejected') {
      return Chip(
        avatar: const Icon(Icons.cancel, size: 18, color: Colors.white),
        label: const Text('Rejected'),
        backgroundColor: Colors.red,
        labelStyle: const TextStyle(color: Colors.white),
      );
    }
    return Chip(
      label: const Text('Pending'),
      backgroundColor: Colors.orange,
      labelStyle: const TextStyle(color: Colors.white),
    );
  }

  String? _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return null;
    try {
      final date = DateTime.tryParse(dateStr);
      if (date == null) return null;
      return DateFormat('yyyy-MM-dd').format(date);
    } catch (e) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _formData.isEmpty) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Time Management'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Card(
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.schedule, color: Colors.blue),
                          const SizedBox(width: 8),
                          const Text(
                            'Time Management',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Consumer<AuthProvider>(
                        builder: (context, authProvider, _) {
                          final user = authProvider.user;
                          return Column(
                            children: [
                              _buildInfoRow('Name', user?['employeeName'] ?? user?['name'] ?? 'N/A'),
                              _buildInfoRow('Employee ID', AppConfig.employeeDbIdForApi(user) ?? 'N/A'),
                              _buildInfoRow('Designation', user?['designation'] ?? 'N/A'),
                              _buildInfoRow('Discipline', user?['discipline'] ?? 'N/A'),
                              const SizedBox(height: 8),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Calendar Week', style: TextStyle(fontWeight: FontWeight.w500)),
                                  DropdownButton<int>(
                                    value: _selectedWeek ?? _getCurrentWeekNumber(),
                                    items: List.generate(52, (i) => i + 1).map((week) {
                                      return DropdownMenuItem(
                                        value: week,
                                        child: Text('Week $week'),
                                      );
                                    }).toList(),
                                    onChanged: (value) {
                                      if (value != null) {
                                        setState(() {
                                          _selectedWeek = value;
                                        });
                                        _initializeWeekData();
                                      }
                                    },
                                  ),
                                ],
                              ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Add Button
              if (_formData.isEmpty)
                Center(
                  child: Column(
                    children: [
                      ElevatedButton.icon(
                        onPressed: _handleAddRow,
                        icon: const Icon(Icons.add),
                        label: const Text('Add Work Details'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text('No work details found. Click to add.'),
                    ],
                  ),
                ),
              // Work Details Cards
              ..._formData.asMap().entries.map((entry) {
                final index = entry.key;
                final row = entry.value;
                final hasId = row['id'] != null;
                return _buildWorkDetailCard(index, row, hasId);
              }),
              // Add Row Button at the end
              if (_formData.isNotEmpty)
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: InkWell(
                    onTap: _handleAddRow,
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.add, color: Colors.blue),
                          SizedBox(width: 8),
                          Text(
                            'Add Another Work Detail',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: Colors.blue),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildWorkDetailCard(int index, Map<String, dynamic> row, bool hasId) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with S.No and Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Entry #${index + 1}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                _getStatusChip(row['status']?.toString()),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            // Reference No
            _buildFormField(
              'Reference No',
              _buildReferenceNoField(index, row, hasId),
              _errorMessages[index]?['referenceNo'],
            ),
            const SizedBox(height: 12),
            // Project Name (read-only)
            _buildReadOnlyField('Project Name', row['projectName']?.toString() ?? ''),
            const SizedBox(height: 12),
            // Task No (read-only)
            _buildReadOnlyField('Task No', row['taskNo']?.toString() ?? ''),
            const SizedBox(height: 12),
            // Area of Work
            _buildFormField(
              'Area of Work *',
              _buildAreaOfWorkField(index, row, hasId),
              _errorMessages[index]?['areaofWork'],
            ),
            const SizedBox(height: 12),
            // Variation
            _buildFormField('Variation', _buildVariationField(index, row, hasId), null),
            const SizedBox(height: 12),
            // Sub Division
            _buildFormField('Sub Division', _buildSubDivisionField(index, row, hasId), null),
            const SizedBox(height: 16),
            // Week Days
            const Text(
              'Weekly Hours',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 3,
              children: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                  .asMap()
                  .entries
                  .map((dayEntry) {
                final dayIdx = dayEntry.key;
                final day = dayEntry.value;
                final dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return _buildDayField(dayIdx, index, day, dayNames[dayIdx], row, hasId);
              }).toList(),
            ),
            const SizedBox(height: 16),
            // Total Hours
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total Hours',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    row['totalHours']?.toString() ?? '0.0',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue),
                  ),
                ],
              ),
            ),
            if (_errorMessages[index]?['totalHours'] != null) ...[
              const SizedBox(height: 4),
              Text(
                _errorMessages[index]!['totalHours']!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ],
            const SizedBox(height: 16),
            // Dates
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_formatDate(row['sentDate']?.toString()) != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Sent Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(_formatDate(row['sentDate']?.toString()) ?? ''),
                    ],
                  ),
                if (_formatDate(row['approvedDate']?.toString()) != null)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      const Text('Approved Date', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      Text(_formatDate(row['approvedDate']?.toString()) ?? ''),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 16),
            // Action Buttons
            if (!hasId)
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _handleSubmit(index),
                      icon: const Icon(Icons.send),
                      label: const Text('Submit'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () => _handleDeleteRow(index),
                    icon: const Icon(Icons.delete),
                    color: Colors.red,
                  ),
                ],
              )
            else
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, color: Colors.green),
                    SizedBox(width: 8),
                    Text(
                      'Work Details sent to team lead for approval',
                      style: TextStyle(color: Colors.green, fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormField(String label, Widget field, String? errorText) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
        ),
        const SizedBox(height: 4),
        field,
        if (errorText != null) ...[
          const SizedBox(height: 4),
          Text(
            errorText,
            style: const TextStyle(color: Colors.red, fontSize: 12),
          ),
        ],
      ],
    );
  }

  Widget _buildReadOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Text(
            value.isEmpty ? 'N/A' : value,
            style: TextStyle(color: Colors.grey[700]),
          ),
        ),
      ],
    );
  }

  Widget _buildReferenceNoField(int index, Map<String, dynamic> row, bool hasId) {
    final referenceNos = _projects
        .map((p) => p['referenceNo']?.toString() ?? '')
        .where((r) => r.isNotEmpty)
        .toSet()
        .toList();
    final selectedRef = row['referenceNo']?.toString() ?? '';
    return DropdownButtonFormField<String>(
      value: selectedRef.isEmpty || !referenceNos.contains(selectedRef) ? null : selectedRef,
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: referenceNos.map((ref) {
        return DropdownMenuItem(value: ref, child: Text(ref));
      }).toList(),
      onChanged: _isFieldDisabled(index, hasId)
          ? null
          : (value) => _handleOnChange('referenceNo', value ?? '', index),
    );
  }

  Widget _buildAreaOfWorkField(int index, Map<String, dynamic> row, bool hasId) {
    final areaNames = _areaOfWork
        .map((area) => area['areaofwork']?.toString() ?? '')
        .where((name) => name.isNotEmpty)
        .toSet()
        .toList();
    final selectedArea = row['areaofWork']?.toString() ?? '';
    return DropdownButtonFormField<String>(
      value: selectedArea.isEmpty || !areaNames.contains(selectedArea) ? null : selectedArea,
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: areaNames.map((areaName) {
        return DropdownMenuItem(value: areaName, child: Text(areaName));
      }).toList(),
      onChanged: _isFieldDisabled(index, hasId)
          ? null
          : (value) => _handleOnChange('areaofWork', value ?? '', index),
    );
  }

  Widget _buildVariationField(int index, Map<String, dynamic> row, bool hasId) {
    final variationNames = _variations
        .map((variation) => variation['variation']?.toString() ?? '')
        .where((name) => name.isNotEmpty)
        .toSet()
        .toList();
    final selectedVariation = row['variation']?.toString() ?? '';
    return DropdownButtonFormField<String>(
      value: selectedVariation.isEmpty || !variationNames.contains(selectedVariation) ? null : selectedVariation,
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: variationNames.map((varName) {
        return DropdownMenuItem(value: varName, child: Text(varName));
      }).toList(),
      onChanged: _isFieldDisabled(index, hasId)
          ? null
          : (value) => _handleOnChange('variation', value ?? '', index),
    );
  }

  Widget _buildSubDivisionField(int index, Map<String, dynamic> row, bool hasId) {
    final subDivisions = (row['subDivisionList']?.toString() ?? '')
        .split(',')
        .where((s) => s.trim().isNotEmpty)
        .map((s) => s.trim())
        .toSet()
        .toList();
    final selectedSubDiv = row['subDivision']?.toString() ?? '';
    return DropdownButtonFormField<String>(
      value: selectedSubDiv.isEmpty || !subDivisions.contains(selectedSubDiv) ? null : selectedSubDiv,
      decoration: const InputDecoration(
        border: OutlineInputBorder(),
        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ),
      items: subDivisions.map((subDiv) {
        return DropdownMenuItem(value: subDiv, child: Text(subDiv));
      }).toList(),
      onChanged: _isFieldDisabled(index, hasId)
          ? null
          : (value) => _handleOnChange('subDivision', value ?? '', index),
    );
  }

  Widget _buildDayField(int dayIdx, int index, String day, String dayName, Map<String, dynamic> row, bool hasId) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          dayName,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: _isDayDisabled(dayIdx, index, hasId) ? Colors.grey : Colors.black,
          ),
        ),
        const SizedBox(height: 4),
        TextFormField(
          initialValue: row[day]?.toString() ?? '',
          decoration: InputDecoration(
            isDense: true,
            border: const OutlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            enabled: !_isDayDisabled(dayIdx, index, hasId),
          ),
          keyboardType: TextInputType.number,
          onChanged: (value) => _handleOnChange(day, value, index),
        ),
      ],
    );
  }
}
