import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:timesheet_mobile/providers/auth_provider.dart';
import 'package:timesheet_mobile/providers/notification_provider.dart';
import 'package:intl/intl.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  bool _hasLoaded = false;

  @override
  void initState() {
    super.initState();
    // Load notifications only once when screen is first created
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_hasLoaded && mounted) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final notificationProvider =
            Provider.of<NotificationProvider>(context, listen: false);
        
        if (!notificationProvider.isLoading) {
          _hasLoaded = true;
          notificationProvider.loadNotifications(
            employeeId: authProvider.user?['EMPID']?.toString(),
          );
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final notificationProvider = Provider.of<NotificationProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (notificationProvider.unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all),
              onPressed: () {
                notificationProvider.markAllAsRead();
              },
              tooltip: 'Mark all as read',
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: notificationProvider.isLoading
                ? null
                : () {
                    notificationProvider.loadNotifications(
                      employeeId: authProvider.user?['EMPID']?.toString(),
                      forceRefresh: true,
                    );
                  },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notificationProvider, _) {
          if (notificationProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (notificationProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(
                    notificationProvider.error!,
                    style: const TextStyle(color: Colors.red),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      notificationProvider.loadNotifications(
                        employeeId: authProvider.user?['EMPID']?.toString(),
                      );
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (notificationProvider.notifications.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('No notifications'),
                ],
              ),
            );
          }

          return Column(
            children: [
              if (notificationProvider.unreadCount > 0)
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Theme.of(context).colorScheme.primary.withOpacity(0.1),
                        Theme.of(context).colorScheme.secondary.withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          Icons.info_rounded,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${notificationProvider.unreadCount} unread notification${notificationProvider.unreadCount > 1 ? 's' : ''}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: notificationProvider.notifications.length,
                  itemBuilder: (context, index) {
                    final notification =
                        notificationProvider.notifications[index];
                    final isRead = notification['isRead'] == true ||
                        notification['isRead'] == 1;

                    return Dismissible(
                      key: Key(notification['id']?.toString() ?? index.toString()),
                      direction: DismissDirection.endToStart,
                      onDismissed: (direction) {
                        if (notification['id'] != null) {
                          notificationProvider.markAsRead(
                            notification['id'].toString(),
                          );
                        }
                      },
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.primary,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Icon(Icons.done_rounded, color: Colors.white, size: 28),
                      ),
                      child: Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        elevation: isRead ? 0 : 2,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(
                            color: isRead
                                ? Colors.grey.shade200
                                : Theme.of(context).colorScheme.primary.withOpacity(0.3),
                            width: isRead ? 1 : 2,
                          ),
                        ),
                        color: isRead ? Colors.white : Colors.blue.shade50,
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isRead
                                  ? Colors.grey.shade200
                                  : Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.notifications_rounded,
                              color: isRead
                                  ? Colors.grey.shade600
                                  : Theme.of(context).colorScheme.primary,
                            ),
                          ),
                          title: Text(
                            notification['title'] ?? 'Notification',
                            style: TextStyle(
                              fontWeight: isRead ? FontWeight.w500 : FontWeight.bold,
                              fontSize: 16,
                              color: isRead ? Colors.grey.shade800 : const Color(0xFF1E293B),
                            ),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (notification['message'] != null)
                                  Text(
                                    notification['message'],
                                    style: TextStyle(
                                      color: Colors.grey.shade700,
                                      fontSize: 14,
                                    ),
                                  ),
                                if (notification['createdAt'] != null) ...[
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.access_time_rounded,
                                        size: 12,
                                        color: Colors.grey.shade600,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        DateFormat('MMM dd, yyyy HH:mm').format(
                                          DateTime.parse(notification['createdAt']),
                                        ),
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                          trailing: isRead
                              ? null
                              : Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: Theme.of(context).colorScheme.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                          onTap: () {
                            if (!isRead && notification['id'] != null) {
                              notificationProvider.markAsRead(
                                notification['id'].toString(),
                              );
                            }
                          },
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

