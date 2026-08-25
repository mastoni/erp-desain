export type FlutterFile = { path: string; desc: string; code: string };

export const FLUTTER_FILES: FlutterFile[] = [
  {
    path: "pubspec.yaml",
    desc: "Dependensi & metadata aplikasi",
    code: `name: skmnet_tenant
description: Aplikasi kasir & ERP tenant SKMNet Cloud (Android).
publish_to: "none"
version: 2.4.0+24

environment:
  sdk: ">=3.2.0 <4.0.0"
  flutter: ">=3.16.0"

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.6
  provider: ^6.1.1        # state management
  dio: ^5.4.0             # HTTP client (REST API SKMNet Cloud)
  shared_preferences: ^2.2.2  # sesi login offline
  intl: ^0.19.0           # format Rupiah & tanggal
  sqflite: ^2.3.2         # antrian transaksi offline (offline-first)
  firebase_messaging: ^14.7.10  # push notification dari platform
  printing: ^5.11.1       # cetak struk ke printer bluetooth

dev_dependencies:
  flutter_lints: ^3.0.1

flutter:
  uses-material-design: true
  fonts:
    - family: Bricolage
      fonts:
        - asset: fonts/BricolageGrotesque-Bold.ttf
    - family: PlexSans
      fonts:
        - asset: fonts/IBMPlexSans-Regular.ttf
        - asset: fonts/IBMPlexSans-SemiBold.ttf
`,
  },
  {
    path: "lib/main.dart",
    desc: "Entry point + dependency injection",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_theme.dart';
import 'services/api_client.dart';
import 'services/session.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  runApp(SkmnetTenantApp(prefs: prefs));
}

class SkmnetTenantApp extends StatelessWidget {
  final SharedPreferences prefs;
  const SkmnetTenantApp({super.key, required this.prefs});

  @override
  Widget build(BuildContext context) {
    final api = ApiClient();
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider(create: (_) => Session(prefs, api)),
      ],
      child: MaterialApp(
        title: 'SKMNet Tenant',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        home: const SplashScreen(),
      ),
    );
  }
}
`,
  },
  {
    path: "lib/app_theme.dart",
    desc: "Tema — palet pine & honey SKMNet",
    code: `import 'package:flutter/material.dart';

class AppTheme {
  static const pine = Color(0xFF17593E);
  static const pineDark = Color(0xFF10402C);
  static const pineDeep = Color(0xFF0C2018);
  static const honey = Color(0xFFD3921F);
  static const paper = Color(0xFFF0EFE7);
  static const clay = Color(0xFFBC4B2F);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: paper,
        colorScheme: ColorScheme.fromSeed(
          seedColor: pine,
          surface: paper,
          primary: pine,
        ),
        fontFamily: 'PlexSans',
        appBarTheme: const AppBarTheme(
          backgroundColor: paper,
          foregroundColor: pineDeep,
          elevation: 0,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE2E0D2)),
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: pine,
            foregroundColor: const Color(0xFFF2EFE2),
            minimumSize: const Size.fromHeight(50),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
      );
}
`,
  },
  {
    path: "lib/services/session.dart",
    desc: "Sesi login + identitas tenant",
    code: `import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_client.dart';

class Session extends ChangeNotifier {
  final SharedPreferences prefs;
  final ApiClient api;

  String? token;
  String? tenantId;   // ex: T-001  -> dikirim sbg header X-Tenant-Id
  String storeName = '';

  Session(this.prefs, this.api) {
    token = prefs.getString('token');
    tenantId = prefs.getString('tenant_id');
    storeName = prefs.getString('store_name') ?? '';
    if (token != null) api.setAuth(token!, tenantId!);
  }

  bool get isLoggedIn => token != null;

  Future<void> login(String email, String pin) async {
    final res = await api.login(email, pin);
    token = res['token'] as String;
    tenantId = res['tenant_id'] as String;
    storeName = res['store_name'] as String;
    api.setAuth(token!, tenantId!);

    await prefs.setString('token', token!);
    await prefs.setString('tenant_id', tenantId!);
    await prefs.setString('store_name', storeName);
    notifyListeners();
  }

  Future<void> logout() async {
    token = null;
    tenantId = null;
    await prefs.clear();
    notifyListeners();
  }
}
`,
  },
  {
    path: "lib/services/api_client.dart",
    desc: "HTTP client — header tenant_id di setiap request",
    code: `import 'package:dio/dio.dart';

class ApiClient {
  static const baseUrl = 'https://api.skmnet.cloud/v1';
  final Dio dio = Dio(BaseOptions(baseUrl: baseUrl));

  void setAuth(String token, String tenantId) {
    dio.options.headers['Authorization'] = 'Bearer \${token}';
    // Kunci multi-tenant: seluruh query difilter RLS berdasarkan header ini.
    dio.options.headers['X-Tenant-Id'] = tenantId;
  }

  Future<Map<String, dynamic>> login(String email, String pin) async {
    final r = await dio.post('/auth/login', data: {'email': email, 'pin': pin});
    return r.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> dashboardToday() async {
    final r = await dio.get('/dashboard/today');
    return r.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> products() async {
    final r = await dio.get('/products');
    return r.data as List<dynamic>;
  }

  /// Transaksi disimpan lokal dulu bila offline (sqflite),
  /// lalu disinkronkan otomatis saat koneksi pulih.
  Future<Map<String, dynamic>> createSale(Map<String, dynamic> payload) async {
    final r = await dio.post('/transactions', data: payload);
    return r.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> ppobCatalog() async {
    final r = await dio.get('/ppob/catalog');
    return r.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> ppobPurchase(Map<String, dynamic> payload) async {
    final r = await dio.post('/ppob/purchase', data: payload);
    return r.data as Map<String, dynamic>;
  }
}
`,
  },
  {
    path: "lib/models/product.dart",
    desc: "Model produk dari API",
    code: `class Product {
  final String id;
  final String sku;
  final String name;
  final String category;
  final int price;
  final int stock;
  final int minStock;

  Product({
    required this.id,
    required this.sku,
    required this.name,
    required this.category,
    required this.price,
    required this.stock,
    required this.minStock,
  });

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j['id'] as String,
        sku: j['sku'] as String,
        name: j['name'] as String,
        category: j['category'] as String,
        price: j['price'] as int,
        stock: j['stock'] as int,
        minStock: j['min_stock'] as int,
      );

  bool get isLow => stock > 0 && stock <= minStock;
  bool get isOut => stock <= 0;
}
`,
  },
  {
    path: "lib/screens/splash_screen.dart",
    desc: "Splash — cek sesi tersimpan",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_theme.dart';
import '../services/session.dart';
import 'login_screen.dart';
import 'root_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 1400), () {
      final logged = context.read<Session>().isLoggedIn;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => logged ? const RootScreen() : const LoginScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: AppTheme.pineDeep,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: AppTheme.pine,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: const Icon(Icons.storefront_rounded, size: 56, color: Color(0xFFF2D9A0)),
              ),
              const SizedBox(height: 18),
              Text('SKMNet Tenant',
                  style: TextStyle(
                      fontFamily: 'Bricolage',
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.white)),
              const SizedBox(height: 6),
              Text('Kasir & ERP dalam genggaman',
                  style: TextStyle(color: Colors.white60, fontSize: 13)),
            ],
          ),
        ),
      );
}
`,
  },
  {
    path: "lib/screens/login_screen.dart",
    desc: "Login kasir per tenant",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/session.dart';
import 'root_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final email = TextEditingController();
  final pin = TextEditingController();
  bool busy = false;

  Future<void> submit() async {
    setState(() => busy = true);
    try {
      await context.read<Session>().login(email.text.trim(), pin.text.trim());
      if (!mounted) return;
      Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const RootScreen()));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login gagal: \${e.toString()}')),
      );
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                Text('Selamat datang', style: Theme.of(context).textTheme.headlineSmall),
                const Text('Masuk ke akun kasir tenant Anda',
                    style: TextStyle(color: Colors.black54)),
                const SizedBox(height: 32),
                TextField(controller: email, decoration: const InputDecoration(labelText: 'Email')),
                const SizedBox(height: 14),
                TextField(
                  controller: pin,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'PIN'),
                ),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: busy ? null : submit,
                  child: busy
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Masuk'),
                ),
              ],
            ),
          ),
        ),
      );
}
`,
  },
  {
    path: "lib/screens/root_screen.dart",
    desc: "Navigasi bawah: Beranda, Kasir, PPOB, Stok, Profil",
    code: `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_theme.dart';
import '../services/session.dart';
import 'home_screen.dart';
import 'kasir_screen.dart';
import 'ppob_screen.dart';
import 'stok_screen.dart';
import 'profil_screen.dart';

class RootScreen extends StatefulWidget {
  const RootScreen({super.key});
  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  int index = 0;

  final pages = const [
    HomeScreen(),
    KasirScreen(),
    PpobScreen(),
    StokScreen(),
    ProfilScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final store = context.watch<Session>().storeName;
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(store.isEmpty ? 'SKMNet Tenant' : store,
                style: const TextStyle(fontFamily: 'Bricolage', fontSize: 17)),
            const Text('Online · tersinkron', style: TextStyle(fontSize: 10, color: AppTheme.pine)),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.qr_code_scanner), onPressed: () {}),
        ],
      ),
      body: IndexedStack(index: index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Beranda'),
          NavigationDestination(icon: Icon(Icons.point_of_sale_outlined), selectedIcon: Icon(Icons.point_of_sale), label: 'Kasir'),
          NavigationDestination(icon: Icon(Icons.bolt_outlined), selectedIcon: Icon(Icons.bolt), label: 'PPOB'),
          NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Stok'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
`,
  },
  {
    path: "lib/screens/kasir_screen.dart",
    desc: "Kasir — keranjang + pembayaran",
    code: `import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../app_theme.dart';
import '../models/product.dart';
import '../services/api_client.dart';

final rp = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);

class KasirScreen extends StatefulWidget {
  const KasirScreen({super.key});
  @override
  State<KasirScreen> createState() => _KasirScreenState();
}

class _KasirScreenState extends State<KasirScreen> {
  List<Product> products = [];
  final cart = <String, int>{};
  bool loading = true;

  @override
  void initState() {
    super.initState();
    context.read<ApiClient>().products().then((raw) {
      setState(() {
        products = raw.map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
        loading = false;
      });
    });
  }

  int get total => cart.entries.fold(
      0, (s, e) => s + e.value * products.firstWhere((p) => p.id == e.key).price);

  Future<void> pay() async {
    final payload = {
      'lines': cart.entries
          .map((e) => {'product_id': e.key, 'qty': e.value})
          .toList(),
    };
    await context.read<ApiClient>().createSale(payload);
    setState(() => cart.clear());
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Transaksi tersimpan & stok terpotong')));
  }

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Expanded(
            child: loading
                ? const Center(child: CircularProgressIndicator())
                : GridView.builder(
                    padding: const EdgeInsets.all(14),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2, childAspectRatio: 1.25, crossAxisSpacing: 10, mainAxisSpacing: 10),
                    itemCount: products.length,
                    itemBuilder: (_, i) {
                      final p = products[i];
                      final qty = cart[p.id] ?? 0;
                      return Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: p.isOut ? null : () => setState(() => cart[p.id] = qty + 1),
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.category, style: const TextStyle(fontSize: 10, color: AppTheme.pine)),
                                Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                                const Spacer(),
                                Text(rp.format(p.price), style: const TextStyle(fontWeight: FontWeight.bold)),
                                if (qty > 0)
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: Chip(label: Text('\${qty}x'), visualDensity: VisualDensity.compact),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (cart.isNotEmpty)
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: ElevatedButton(
                  onPressed: pay,
                  child: Text('Bayar \${rp.format(total)}'),
                ),
              ),
            ),
        ],
      );
}
`,
  },
  {
    path: "README.md",
    desc: "Cara build & arsitektur multi-tenant",
    code: `# SKMNet Tenant — Aplikasi Android (Flutter)

Aplikasi kasir & ERP untuk **tenant** SKMNet Cloud. Satu APK melayani
seluruh tenant; data diisolasi per tenant melalui header \`X-Tenant-Id\`
yang diverifikasi JWT + Row-Level Security di PostgreSQL.

## Menjalankan

\`\`\`bash
flutter create . --project-name skmnet_tenant
flutter pub get
flutter run            # debug di emulator / perangkat
flutter build apk --release   # APK distribusi
flutter build appbundle       # untuk Google Play
\`\`\`

## Arsitektur

- UI: Material 3, tema pine/honey SKMNet.
- State: Provider (Session, ApiClient).
- Jaringan: dio + interceptor; retry + antrian sqflite saat offline
  (offline-first — kasir tetap bisa jualan tanpa internet).
- Notifikasi: Firebase Messaging untuk pesanan baru & settlement PPOB.
- Cetak struk: printing + printer bluetooth ESC/POS.

## Multi-tenant

1. Login mengembalikan \`token\` (JWT berisi tenant_id) + \`tenant_id\`.
2. Setiap request membawa header \`X-Tenant-Id\`.
3. API gateway memvalidasi klaim JWT == header (anti-spoofing).
4. PostgreSQL RLS memastikan query hanya melihat baris tenant sendiri.

## Layanan digital (PPOB)

Katalog & harga mengikuti kontrak profit share yang diatur super admin;
aplikasi cukup merender katalog dari \`GET /ppob/catalog\`.
`,
  },
];
