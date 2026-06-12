import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gp_partner_app/main.dart';

void main() {
  testWidgets('GP Partner login screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(const GpPartnerMobileApp());
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
