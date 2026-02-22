import 'package:flutter/material.dart';

/// App bar title with logo on the left. Use as AppBar title.
class AppBarLogoTitle extends StatelessWidget {
  final String title;

  const AppBarLogoTitle({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: Image.asset(
            'assets/icons/app_icon.png',
            height: 32,
            width: 32,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(Icons.access_time_rounded, color: Colors.white, size: 28),
          ),
        ),
        const SizedBox(width: 10),
        Flexible(
          child: Text(
            title,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}
