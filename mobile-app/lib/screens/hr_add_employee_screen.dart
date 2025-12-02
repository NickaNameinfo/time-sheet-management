import 'package:flutter/material.dart';
import 'package:timesheet_mobile/services/api_service.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class HrAddEmployeeScreen extends StatefulWidget {
  final int? employeeId;

  const HrAddEmployeeScreen({super.key, this.employeeId});

  @override
  State<HrAddEmployeeScreen> createState() => _HrAddEmployeeScreenState();
}

class _HrAddEmployeeScreenState extends State<HrAddEmployeeScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isSubmitting = false;
  
  // Form controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _empIdController = TextEditingController();
  final _passwordController = TextEditingController();
  
  File? _imageFile;
  String? _selectedRole;
  String? _selectedDesignation;

  @override
  void initState() {
    super.initState();
    if (widget.employeeId != null) {
      _loadEmployee();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _empIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _loadEmployee() async {
    if (widget.employeeId == null) return;
    
    setState(() => _isLoading = true);
    try {
      final employee = await _apiService.getEmployee(widget.employeeId!);
      setState(() {
        _nameController.text = employee['employeeName']?.toString() ?? '';
        _emailController.text = employee['userName']?.toString() ?? '';
        _phoneController.text = employee['mobile']?.toString() ?? '';
        _empIdController.text = employee['EMPID']?.toString() ?? '';
        _selectedRole = employee['role']?.toString();
        _selectedDesignation = employee['designation']?.toString();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading employee: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);
    try {
      final formData = {
        'employeeName': _nameController.text,
        'userName': _emailController.text,
        'mobile': _phoneController.text,
        'EMPID': _empIdController.text,
        'role': _selectedRole ?? 'employee',
        'designation': _selectedDesignation ?? '',
        if (_passwordController.text.isNotEmpty) 'password': _passwordController.text,
      };

      if (widget.employeeId != null) {
        // Update existing employee
        await _apiService.updateEmployee(widget.employeeId!, formData);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Employee updated successfully')),
          );
          Navigator.pop(context);
        }
      } else {
        // Create new employee
        await _apiService.createEmployee(formData);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Employee created successfully')),
          );
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.employeeId == null ? 'Add Employee' : 'Edit Employee'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Profile Picture
                    Center(
                      child: Stack(
                        children: [
                          CircleAvatar(
                            radius: 50,
                            backgroundImage: _imageFile != null
                                ? FileImage(_imageFile!)
                                : null,
                            child: _imageFile == null
                                ? const Icon(Icons.person, size: 50)
                                : null,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: IconButton(
                              icon: const Icon(Icons.camera_alt),
                              onPressed: _pickImage,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Name
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter name';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Email
                    TextFormField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter email';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Phone
                    TextFormField(
                      controller: _phoneController,
                      decoration: const InputDecoration(
                        labelText: 'Phone',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    // Employee ID
                    TextFormField(
                      controller: _empIdController,
                      decoration: const InputDecoration(
                        labelText: 'Employee ID',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter employee ID';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Role
                    DropdownButtonFormField<String>(
                      value: _selectedRole,
                      decoration: const InputDecoration(
                        labelText: 'Role',
                        border: OutlineInputBorder(),
                      ),
                      items: ['employee', 'teamlead', 'hr', 'admin'].map((role) {
                        return DropdownMenuItem(
                          value: role,
                          child: Text(role.toUpperCase()),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() => _selectedRole = value);
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please select role';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Password (only for new employees)
                    if (widget.employeeId == null)
                      TextFormField(
                        controller: _passwordController,
                        decoration: const InputDecoration(
                          labelText: 'Password',
                          border: OutlineInputBorder(),
                        ),
                        obscureText: true,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Please enter password';
                          }
                          return null;
                        },
                      ),
                    const SizedBox(height: 24),
                    // Submit Button
                    ElevatedButton(
                      onPressed: _isSubmitting ? null : _submit,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(widget.employeeId == null ? 'Create Employee' : 'Update Employee'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}

