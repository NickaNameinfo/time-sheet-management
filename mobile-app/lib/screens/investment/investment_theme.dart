import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

/// Shared styling and accessibility for Investment screens.
class InvestmentTheme {
  InvestmentTheme._();

  static const double kCardRadius = 20;
  static const double kCardPadding = 20;
  static const double kMinTouchTarget = 48;
  static const double kSectionSpacing = 24;

  static const Color kBackground = Color(0xFFF1F5F9);
  static const Color kPrimary = Color(0xFF6366F1);
  static const Color kPrimaryDark = Color(0xFF4F46E5);
  static const Color kSuccess = Color(0xFF22C55E);
  static const Color kInfo = Color(0xFF0EA5E9);
  static const Color kSurface = Color(0xFFFFFFFF);

  /// Gradient for app bars and accents
  static const LinearGradient kAppBarGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [kPrimary, kPrimaryDark],
  );

  /// App bar theme for all investment screens
  static AppBar appBar(String title, {List<Widget>? actions, Widget? leading}) {
    return AppBar(
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, letterSpacing: -0.3)),
      centerTitle: false,
      elevation: 0,
      scrolledUnderElevation: 2,
      backgroundColor: kPrimary,
      foregroundColor: Colors.white,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      iconTheme: const IconThemeData(color: Colors.white),
      actions: actions,
      leading: leading,
      flexibleSpace: Container(decoration: const BoxDecoration(gradient: kAppBarGradient)),
    );
  }

  /// Section heading style
  static TextStyle sectionTitle(BuildContext context) =>
      Theme.of(context).textTheme.titleMedium!.copyWith(fontWeight: FontWeight.bold, color: Colors.grey.shade800, letterSpacing: -0.2);

  /// Highlight style for amount values (invested, withdrawable, etc.)
  static TextStyle amountHighlight({Color? color, double? fontSize}) =>
      TextStyle(fontWeight: FontWeight.bold, fontSize: fontSize ?? 18, color: color ?? kPrimary, letterSpacing: -0.2);

  /// Highlight style for earnings / interest values
  static TextStyle earningsHighlight({double? fontSize}) =>
      TextStyle(fontWeight: FontWeight.bold, fontSize: fontSize ?? 16, color: kSuccess, letterSpacing: -0.2);

  /// Highlight style for dates (maturity, holding, start)
  static TextStyle dateHighlight({double? fontSize}) =>
      TextStyle(fontWeight: FontWeight.w600, fontSize: fontSize ?? 14, color: kInfo);

  static BoxDecoration cardDecoration({Color? color}) {
    return BoxDecoration(
      color: color ?? kSurface,
      borderRadius: BorderRadius.circular(kCardRadius),
      border: Border.all(color: Colors.black.withOpacity(0.04), width: 1),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.06),
          blurRadius: 14,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  /// Card with optional left accent
  static BoxDecoration cardWithAccent(Color accentColor) {
    return BoxDecoration(
      color: kSurface,
      borderRadius: BorderRadius.circular(kCardRadius),
      border: Border.all(color: accentColor.withOpacity(0.25), width: 1.5),
      boxShadow: [
        BoxShadow(color: accentColor.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 4)),
        BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 2)),
      ],
    );
  }

  static Widget sectionCard({
    required Widget child,
    EdgeInsets? padding,
  }) {
    return Container(
      padding: EdgeInsets.all(padding?.top ?? kCardPadding),
      decoration: cardDecoration(),
      child: child,
    );
  }

  /// Format maturity_date from API (ISO or YYYY-MM-DD) for display.
  static String formatMaturityDate(String? dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty) return '—';
    final s = dateStr.trim();
    DateTime? dt = DateTime.tryParse(s);
    if (dt == null && s.length >= 10) {
      dt = DateTime.tryParse(s.substring(0, 10));
    }
    if (dt == null) return '—';
    final hasTime = dt.hour != 0 || dt.minute != 0 || dt.second != 0;
    if (hasTime) {
      return DateFormat('d MMM y, h:mm a').format(dt.toLocal());
    }
    return DateFormat('d MMM y').format(dt.toLocal());
  }

  /// Wrap tappable widgets to meet minimum touch target (48x48).
  static Widget minTouchTarget(Widget child, {VoidCallback? onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(kCardRadius),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: kMinTouchTarget, minHeight: kMinTouchTarget),
          child: Center(child: child),
        ),
      ),
    );
  }
}
