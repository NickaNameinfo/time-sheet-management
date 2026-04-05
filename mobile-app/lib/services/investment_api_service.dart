import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timesheet_mobile/services/challenge_api_service.dart';
import 'package:timesheet_mobile/utils/app_config.dart';

class InvestmentApiService {
  final Dio _dio = Dio();

  InvestmentApiService() {
    _dio.options.baseUrl = AppConfig.baseUrl;
    _dio.options.connectTimeout = AppConfig.requestTimeout;
    _dio.options.receiveTimeout = AppConfig.requestTimeout;
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConfig.challengeTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove(AppConfig.challengeTokenKey);
          await prefs.remove(AppConfig.challengeUserKey);
          ChallengeApiService.onSessionExpired?.call();
          return handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              type: DioExceptionType.badResponse,
              error: SessionExpiredException(),
            ),
          );
        }
        return handler.next(error);
      },
    ));
  }

  Future<Map<String, dynamic>> _handleResponse(Response response) async {
    final data = response.data;
    if (data is! Map) throw Exception('Invalid response');
    if (data['Status'] == 'Error') {
      throw Exception(data['Error']?.toString() ?? 'Request failed');
    }
    return Map<String, dynamic>.from(data);
  }

  Future<Map<String, dynamic>> getKycStatus() async {
    final response = await _dio.get(AppConfig.investmentKycStatus);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> submitKyc({
    required String bankHolderName,
    required String bankName,
    required String accountNumber,
    required String ifscCode,
    required String branch,
    required String address,
    required String aadhaarNumber,
    required String panNumber,
    List<int>? aadhaarFileBytes,
    List<int>? panFileBytes,
  }) async {
    if (aadhaarFileBytes == null && panFileBytes == null) {
      final response = await _dio.post(
        AppConfig.investmentKycSubmit,
        data: {
          'bank_holder_name': bankHolderName,
          'bank_name': bankName,
          'account_number': accountNumber,
          'ifsc_code': ifscCode,
          'branch': branch,
          'address': address,
          'aadhaar_number': aadhaarNumber,
          'pan_number': panNumber,
        },
      );
      final result = await _handleResponse(response);
      return result['Result'] as Map<String, dynamic>? ?? {};
    }
    final formData = FormData.fromMap({
      'bank_holder_name': bankHolderName,
      'bank_name': bankName,
      'account_number': accountNumber,
      'ifsc_code': ifscCode,
      'branch': branch,
      'address': address,
      'aadhaar_number': aadhaarNumber,
      'pan_number': panNumber,
    });
    if (aadhaarFileBytes != null) {
      formData.files.add(MapEntry(
        'aadhaar_document',
        MultipartFile.fromBytes(aadhaarFileBytes, filename: 'aadhaar.jpg'),
      ));
    }
    if (panFileBytes != null) {
      formData.files.add(MapEntry(
        'pan_document',
        MultipartFile.fromBytes(panFileBytes, filename: 'pan.jpg'),
      ));
    }
    final response = await _dio.post(
      AppConfig.investmentKycSubmit,
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
        sendTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
      ),
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  /// Upload only Aadhaar/PAN documents. Use when KYC is already VERIFIED and user only needs to add/update documents.
  Future<Map<String, dynamic>> uploadKycDocuments({
    List<int>? aadhaarFileBytes,
    List<int>? panFileBytes,
  }) async {
    if (aadhaarFileBytes == null && panFileBytes == null) {
      throw Exception('At least one document (Aadhaar or PAN) is required');
    }
    final formData = FormData.fromMap({});
    if (aadhaarFileBytes != null) {
      formData.files.add(MapEntry(
        'aadhaar_document',
        MultipartFile.fromBytes(aadhaarFileBytes, filename: 'aadhaar.jpg'),
      ));
    }
    if (panFileBytes != null) {
      formData.files.add(MapEntry(
        'pan_document',
        MultipartFile.fromBytes(panFileBytes, filename: 'pan.jpg'),
      ));
    }
    final response = await _dio.post(
      AppConfig.investmentKycDocuments,
      data: formData,
      options: Options(
        contentType: 'multipart/form-data',
        sendTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
      ),
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getPlans() async {
    final response = await _dio.get(AppConfig.investmentPlans);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getDashboard() async {
    final response = await _dio.get(AppConfig.investmentDashboard);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> validateCheckout({required int planId, required double amount}) async {
    final response = await _dio.post(
      AppConfig.investmentCheckoutValidate,
      data: {'plan_id': planId, 'amount': amount},
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  /// Create Razorpay order. Returns { id, amount, currency, receipt } for Razorpay checkout.
  Future<Map<String, dynamic>> createRazorpayOrder({required int planId, required double amount}) async {
    final response = await _dio.post(
      AppConfig.investmentCheckoutCreateOrder,
      data: {'plan_id': planId, 'amount': amount},
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> paymentSuccess({
    required int planId,
    required double amount,
    required String transactionId,
  }) async {
    final response = await _dio.post(
      AppConfig.investmentPaymentSuccess,
      data: {
        'plan_id': planId,
        'amount': amount,
        'transaction_id': transactionId,
      },
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<List<dynamic>> listInvestments() async {
    final response = await _dio.get(AppConfig.investmentList);
    final result = await _handleResponse(response);
    final data = result['Result'] as Map<String, dynamic>?;
    final list = data?['investments'];
    return list is List ? list : [];
  }

  /// Referral: total pending (awaiting admin approval) and approved (withdrawable).
  Future<Map<String, dynamic>> getReferralStats() async {
    final response = await _dio.get(AppConfig.investmentReferralStats);
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  /// Referral history: list of referred users (email, amount, status, date).
  Future<List<dynamic>> getReferralHistory() async {
    final response = await _dio.get(AppConfig.investmentReferralHistory);
    final result = await _handleResponse(response);
    final res = result['Result'] as Map<String, dynamic>? ?? {};
    final list = res['referral_history'];
    return list is List ? list : [];
  }

  Future<Map<String, dynamic>> getWithdrawPreview(int investmentId) async {
    final response = await _dio.get('${AppConfig.investmentWithdrawPreview}/$investmentId');
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> withdraw(int investmentId) async {
    final response = await _dio.post(AppConfig.investmentWithdraw, data: {'investment_id': investmentId});
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getReports({
    String? dateFrom,
    String? dateTo,
    String? status,
    String? planType,
    double? amountMin,
    double? amountMax,
  }) async {
    final response = await _dio.get(
      AppConfig.investmentReports,
      queryParameters: {
        if (dateFrom != null) 'date_from': dateFrom,
        if (dateTo != null) 'date_to': dateTo,
        if (status != null) 'status': status,
        if (planType != null) 'plan_type': planType,
        if (amountMin != null) 'amount_min': amountMin,
        if (amountMax != null) 'amount_max': amountMax,
      },
    );
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  /// GET /investment/reports/:id - single report by investment id
  Future<Map<String, dynamic>> getReportById(int id) async {
    final response = await _dio.get('${AppConfig.investmentReports}/$id');
    final result = await _handleResponse(response);
    return result['Result'] as Map<String, dynamic>? ?? {};
  }

  Future<List<dynamic>> getNotifications() async {
    final response = await _dio.get(AppConfig.investmentNotifications);
    final result = await _handleResponse(response);
    final list = result['notifications'];
    return list is List ? list : [];
  }
}
