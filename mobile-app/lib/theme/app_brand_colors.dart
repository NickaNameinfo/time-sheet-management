import 'package:flutter/material.dart';

/// Brand palette (aligned with web `front-end/src/theme/colors.js`).
class AppBrandColors {
  AppBrandColors._();

  static const Color blue = Color(0xFF4C86F9);
  static const Color green = Color(0xFF49A84C);
  static const Color amber = Color(0xFFF6BC00);

  static const Color blueDark = Color(0xFF3D6DD1);
  static const Color greenDark = Color(0xFF3D8B40);
  static const Color amberDark = Color(0xFFE0A800);

  /// Hero / card gradients (blue → green).
  static const LinearGradient heroGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [blue, green],
  );
}
