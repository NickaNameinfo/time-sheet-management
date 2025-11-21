import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:logger/logger.dart';

class OfflineService {
  static Database? _database;
  static final Logger _logger = Logger();
  static SharedPreferences? _prefs;
  
  static Future<void> init() async {
    if (kIsWeb) {
      // On web, use SharedPreferences instead of SQLite
      _prefs = await SharedPreferences.getInstance();
      _logger.i('OfflineService initialized (web mode - using SharedPreferences)');
      return;
    }
    
    try {
      final databasePath = await getDatabasesPath();
      final path = join(databasePath, 'timesheet_offline.db');
      
      _database = await openDatabase(
        path,
        version: 1,
        onCreate: (db, version) async {
        // Attendance table
        await db.execute('''
          CREATE TABLE attendance_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action TEXT NOT NULL,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            retry_count INTEGER DEFAULT 0
          )
        ''');
        
        // Leave applications table
        await db.execute('''
          CREATE TABLE leave_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            synced INTEGER DEFAULT 0,
            retry_count INTEGER DEFAULT 0
          )
        ''');
        
        // Cached data table
        await db.execute('''
          CREATE TABLE cached_data (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            expiry_seconds INTEGER DEFAULT 3600
          )
        ''');
        
        _logger.i('Offline database initialized');
      },
      );
      _logger.i('OfflineService initialized (mobile mode - using SQLite)');
    } catch (e) {
      _logger.e('Failed to initialize SQLite, falling back to SharedPreferences: $e');
      _prefs = await SharedPreferences.getInstance();
    }
  }
  
  // Save attendance action to queue
  static Future<int> queueAttendance({
    required String action,
    required Map<String, dynamic> data,
  }) async {
    if (kIsWeb || _database == null) {
      if (_prefs == null) await init();
      // Use SharedPreferences for web
      final key = 'attendance_${DateTime.now().millisecondsSinceEpoch}';
      final queue = _prefs!.getStringList('attendance_queue') ?? [];
      queue.add(jsonEncode({
        'id': queue.length + 1,
        'action': action,
        'data': data,
        'timestamp': DateTime.now().toIso8601String(),
        'synced': 0,
        'retry_count': 0,
      }));
      await _prefs!.setStringList('attendance_queue', queue);
      return queue.length;
    }
    
    if (_database == null) await init();
    
    return await _database!.insert(
      'attendance_queue',
      {
        'action': action,
        'data': jsonEncode(data),
        'timestamp': DateTime.now().toIso8601String(),
        'synced': 0,
        'retry_count': 0,
      },
    );
  }
  
  // Get pending attendance actions
  static Future<List<Map<String, dynamic>>> getPendingAttendance() async {
    if (kIsWeb || _database == null) {
      if (_prefs == null) await init();
      final queue = _prefs!.getStringList('attendance_queue') ?? [];
      return queue
          .map((item) => jsonDecode(item) as Map<String, dynamic>)
          .where((item) => item['synced'] == 0)
          .toList();
    }
    
    if (_database == null) await init();
    
    final results = await _database!.query(
      'attendance_queue',
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'timestamp ASC',
    );
    
    return results.map((row) {
      return {
        'id': row['id'],
        'action': row['action'],
        'data': jsonDecode(row['data'] as String),
        'timestamp': row['timestamp'],
        'retry_count': row['retry_count'],
      };
    }).toList();
  }
  
  // Mark attendance as synced
  static Future<void> markAttendanceSynced(int id) async {
    if (_database == null) await init();
    
    await _database!.update(
      'attendance_queue',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
  
  // Increment retry count
  static Future<void> incrementRetryCount(int id) async {
    if (_database == null) await init();
    
    await _database!.rawUpdate(
      'UPDATE attendance_queue SET retry_count = retry_count + 1 WHERE id = ?',
      [id],
    );
  }
  
  // Save leave application to queue
  static Future<int> queueLeave(Map<String, dynamic> data) async {
    if (_database == null) await init();
    
    return await _database!.insert(
      'leave_queue',
      {
        'data': jsonEncode(data),
        'timestamp': DateTime.now().toIso8601String(),
        'synced': 0,
        'retry_count': 0,
      },
    );
  }
  
  // Get pending leave applications
  static Future<List<Map<String, dynamic>>> getPendingLeaves() async {
    if (_database == null) await init();
    
    final results = await _database!.query(
      'leave_queue',
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'timestamp ASC',
    );
    
    return results.map((row) {
      return {
        'id': row['id'],
        'data': jsonDecode(row['data'] as String),
        'timestamp': row['timestamp'],
        'retry_count': row['retry_count'],
      };
    }).toList();
  }
  
  // Mark leave as synced
  static Future<void> markLeaveSynced(int id) async {
    if (_database == null) await init();
    
    await _database!.update(
      'leave_queue',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
  
  // Cache data
  static Future<void> cacheData({
    required String key,
    required Map<String, dynamic> data,
    int expirySeconds = 3600,
  }) async {
    if (kIsWeb || _database == null) {
      if (_prefs == null) await init();
      final cacheKey = 'cache_$key';
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().toIso8601String(),
        'expiry_seconds': expirySeconds,
      };
      await _prefs!.setString(cacheKey, jsonEncode(cacheData));
      return;
    }
    
    if (_database == null) await init();
    
    await _database!.insert(
      'cached_data',
      {
        'key': key,
        'data': jsonEncode(data),
        'timestamp': DateTime.now().toIso8601String(),
        'expiry_seconds': expirySeconds,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
  
  // Get cached data
  static Future<Map<String, dynamic>?> getCachedData(String key) async {
    if (kIsWeb || _database == null) {
      if (_prefs == null) await init();
      final cacheKey = 'cache_$key';
      final cached = _prefs!.getString(cacheKey);
      if (cached == null) return null;
      
      final cacheData = jsonDecode(cached) as Map<String, dynamic>;
      final timestamp = DateTime.parse(cacheData['timestamp'] as String);
      final expirySeconds = cacheData['expiry_seconds'] as int;
      final expiryTime = timestamp.add(Duration(seconds: expirySeconds));
      
      if (DateTime.now().isAfter(expiryTime)) {
        await _prefs!.remove(cacheKey);
        return null;
      }
      
      return cacheData['data'] as Map<String, dynamic>;
    }
    
    if (_database == null) await init();
    
    final results = await _database!.query(
      'cached_data',
      where: 'key = ?',
      whereArgs: [key],
    );
    
    if (results.isEmpty) return null;
    
    final row = results.first;
    final timestamp = DateTime.parse(row['timestamp'] as String);
    final expirySeconds = row['expiry_seconds'] as int;
    final expiryTime = timestamp.add(Duration(seconds: expirySeconds));
    
    if (DateTime.now().isAfter(expiryTime)) {
      // Cache expired
      await _database!.delete(
        'cached_data',
        where: 'key = ?',
        whereArgs: [key],
      );
      return null;
    }
    
    return jsonDecode(row['data'] as String);
  }
  
  // Clear old synced records
  static Future<void> clearOldRecords() async {
    if (_database == null) await init();
    
    final cutoffDate = DateTime.now().subtract(const Duration(days: 30));
    
    await _database!.delete(
      'attendance_queue',
      where: 'synced = ? AND timestamp < ?',
      whereArgs: [1, cutoffDate.toIso8601String()],
    );
    
    await _database!.delete(
      'leave_queue',
      where: 'synced = ? AND timestamp < ?',
      whereArgs: [1, cutoffDate.toIso8601String()],
    );
  }
}

