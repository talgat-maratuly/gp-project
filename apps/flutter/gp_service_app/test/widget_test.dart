import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:gp_service_app/main.dart';

void main() {
  testWidgets('GP Service login screen renders', (WidgetTester tester) async {
    await tester.pumpWidget(const GpServiceMobileApp());
    await tester.pump();

    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });
}
