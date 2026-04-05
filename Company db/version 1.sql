-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Mar 19, 2026 at 10:30 AM
-- Server version: 11.8.3-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u490757224_timesheet`
--

-- --------------------------------------------------------

--
-- Table structure for table `approval_history`
--

CREATE TABLE `approval_history` (
  `id` int(11) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `approver_id` int(11) NOT NULL,
  `approval_level` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `employee_id` int(11) DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `approval_workflows`
--

CREATE TABLE `approval_workflows` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `entity_type` varchar(50) NOT NULL,
  `approval_levels` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`approval_levels`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `areaofwork`
--

CREATE TABLE `areaofwork` (
  `id` int(11) NOT NULL,
  `areaofwork` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `areaofwork_projects`
--

CREATE TABLE `areaofwork_projects` (
  `id` int(11) NOT NULL,
  `areaofwork_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_rates`
--

CREATE TABLE `billing_rates` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `discipline_code` varchar(255) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `hourly_rate` decimal(10,2) NOT NULL,
  `ot_rate_multiplier` decimal(3,2) DEFAULT 1.50,
  `effective_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `challenges`
--

CREATE TABLE `challenges` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `total_days` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `reminder_time` time DEFAULT NULL COMMENT 'Daily reminder time (e.g. 09:00)',
  `status` enum('active','completed','archived') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `challenge_days`
--

CREATE TABLE `challenge_days` (
  `id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `day_number` int(11) NOT NULL,
  `date` date NOT NULL,
  `day_name` varchar(20) NOT NULL COMMENT 'Monday, Tuesday, etc.',
  `status` enum('pending','completed','missed') DEFAULT 'pending',
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `challenge_users`
--

CREATE TABLE `challenge_users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `location` varchar(500) DEFAULT NULL COMMENT 'lat,lng or place name',
  `address` text DEFAULT NULL,
  `referred_by_user_id` int(11) DEFAULT NULL COMMENT 'challenge_users.id of referrer',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `challenge_user_settings`
--

CREATE TABLE `challenge_user_settings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reminder_enabled` tinyint(1) DEFAULT 1,
  `eod_reminder_enabled` tinyint(1) DEFAULT 1,
  `missed_alert_enabled` tinyint(1) DEFAULT 1,
  `timezone` varchar(100) DEFAULT 'UTC',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'UAE',
  `payment_terms` varchar(255) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'AED',
  `tax_id` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
  `company_code` varchar(50) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_billing`
--

CREATE TABLE `company_billing` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `invoice_no` varchar(50) NOT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `amount_due` decimal(12,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','sent','paid','overdue','void') NOT NULL DEFAULT 'draft',
  `paid_at` datetime DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_menu_permissions`
--

CREATE TABLE `company_menu_permissions` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `menu_key` varchar(100) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_menu_trial_settings`
--

CREATE TABLE `company_menu_trial_settings` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `menu_key` varchar(100) NOT NULL,
  `trial_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `trial_days` int(11) NOT NULL DEFAULT 30,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_subscriptions`
--

CREATE TABLE `company_subscriptions` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `status` enum('active','paused','cancelled','expired') NOT NULL DEFAULT 'active',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_users`
--

CREATE TABLE `company_users` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('company_admin','company_user') NOT NULL DEFAULT 'company_user',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `compoff`
--

CREATE TABLE `compoff` (
  `id` int(11) NOT NULL,
  `leaveType` varchar(50) DEFAULT NULL,
  `leaveFrom` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `employeeName` varchar(255) DEFAULT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `workHours` decimal(5,2) DEFAULT NULL,
  `eligibility` varchar(50) DEFAULT NULL,
  `leaveStatus` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approverId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `crm_entries`
--

CREATE TABLE `crm_entries` (
  `id` int(11) NOT NULL,
  `crmDate` date NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `contactPerson` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'New',
  `scheduleDate` date DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designation`
--

CREATE TABLE `designation` (
  `id` int(11) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discipline`
--

CREATE TABLE `discipline` (
  `id` int(11) NOT NULL,
  `discipline` varchar(255) NOT NULL,
  `discipline_code` varchar(50) DEFAULT NULL COMMENT 'Code for project creation',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `employeeName` varchar(250) NOT NULL,
  `EMPID` int(50) NOT NULL,
  `employeeEmail` varchar(150) NOT NULL,
  `userName` varchar(150) NOT NULL,
  `password` varchar(250) NOT NULL,
  `role` varchar(150) NOT NULL,
  `discipline` varchar(250) NOT NULL,
  `designation` varchar(250) NOT NULL,
  `date` varchar(150) NOT NULL,
  `employeeImage` varchar(250) NOT NULL,
  `id_proof` varchar(500) DEFAULT NULL,
  `employeeStatus` varchar(160) NOT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `id` int(11) NOT NULL,
  `relievingDate` date DEFAULT NULL,
  `permanentDate` date DEFAULT NULL,
  `father_name` varchar(255) DEFAULT NULL,
  `mother_name` varchar(255) DEFAULT NULL,
  `parent_contact` varchar(50) DEFAULT NULL,
  `parent_address` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hr`
--

CREATE TABLE `hr` (
  `id` int(11) NOT NULL,
  `hrName` varchar(250) NOT NULL,
  `userName` varchar(150) NOT NULL,
  `password` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investments`
--

CREATE TABLE `investments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `interest_percentage` decimal(5,2) NOT NULL,
  `lockin_days` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `maturity_date` date NOT NULL,
  `status` enum('ACTIVE','MATURED','WITHDRAWN','CANCELLED') DEFAULT 'ACTIVE',
  `transaction_id` varchar(255) DEFAULT NULL COMMENT 'Payment gateway reference',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `kyc_verified_at_investment` timestamp NULL DEFAULT NULL COMMENT 'When KYC was VERIFIED at investment time; NULL = KYC not verified at time of payment'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investment_audit_log`
--

CREATE TABLE `investment_audit_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL COMMENT 'KYC_SUBMIT, KYC_VERIFIED, INVESTMENT_CREATED, WITHDRAWAL',
  `entity_type` varchar(50) DEFAULT NULL COMMENT 'kyc, investment, withdrawal',
  `entity_id` int(11) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investment_kyc`
--

CREATE TABLE `investment_kyc` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'challenge_users.id',
  `bank_holder_name` varchar(255) NOT NULL,
  `bank_name` varchar(255) NOT NULL,
  `account_number_encrypted` varchar(500) NOT NULL,
  `ifsc_code` varchar(20) NOT NULL,
  `branch` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `aadhaar_encrypted` varchar(500) NOT NULL,
  `pan_encrypted` varchar(500) NOT NULL,
  `aadhaar_document_path` varchar(500) DEFAULT NULL COMMENT 'Uploaded Aadhaar card image path',
  `pan_document_path` varchar(500) DEFAULT NULL COMMENT 'Uploaded PAN card image path',
  `document_verification_status` varchar(32) DEFAULT 'PENDING' COMMENT 'PENDING, VERIFIED',
  `status` enum('PENDING_VERIFICATION','VERIFIED') DEFAULT 'PENDING_VERIFICATION',
  `verified_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investment_notifications`
--

CREATE TABLE `investment_notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investment_plans`
--

CREATE TABLE `investment_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'e.g. Plan A, Below 5000',
  `category` varchar(50) NOT NULL COMMENT 'below_5000 | above_5000',
  `min_amount` decimal(15,2) NOT NULL,
  `max_amount` decimal(15,2) NOT NULL,
  `interest_percentage` decimal(5,2) NOT NULL,
  `lockin_days` int(11) NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `investment_withdrawal_requests`
--

CREATE TABLE `investment_withdrawal_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `investment_id` int(11) NOT NULL,
  `requested_amount` decimal(15,2) NOT NULL COMMENT 'Total before deduction',
  `deduction_percent` decimal(5,2) NOT NULL DEFAULT 3.00,
  `deduction_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount_after_deduction` decimal(15,2) NOT NULL COMMENT 'Amount user will receive',
  `days_held` int(11) NOT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'PENDING_APPROVAL' COMMENT 'PENDING_APPROVAL, APPROVED, REJECTED',
  `requested_at` timestamp NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL COMMENT 'Admin user id',
  `admin_note` text DEFAULT NULL,
  `settlement_status` varchar(32) DEFAULT NULL COMMENT 'PENDING, PROCESSING, SETTLED',
  `settlement_date` date DEFAULT NULL COMMENT 'Expected or actual settlement date',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(255) NOT NULL,
  `client_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `tax_rate` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'AED',
  `status` varchar(50) DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `work_detail_id` int(11) DEFAULT NULL,
  `description` varchar(500) DEFAULT NULL,
  `hours` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leavedetails`
--

CREATE TABLE `leavedetails` (
  `id` int(150) NOT NULL,
  `leaveType` varchar(150) DEFAULT NULL,
  `leaveFrom` varchar(150) DEFAULT NULL,
  `leaveTo` varchar(150) DEFAULT NULL,
  `leaveHours` varchar(150) DEFAULT NULL,
  `reason` varchar(250) DEFAULT NULL,
  `leaveStatus` varchar(150) DEFAULT NULL,
  `employeeName` varchar(250) DEFAULT NULL,
  `employeeId` varchar(200) DEFAULT NULL,
  `totalLeaves` varchar(150) DEFAULT NULL,
  `approverId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_accruals`
--

CREATE TABLE `leave_accruals` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type` varchar(50) NOT NULL,
  `accrual_date` date NOT NULL,
  `accrual_amount` decimal(5,2) NOT NULL,
  `accrual_type` varchar(50) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_balances`
--

CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type` varchar(50) NOT NULL,
  `balance` decimal(5,2) DEFAULT 0.00,
  `accrued` decimal(5,2) DEFAULT 0.00,
  `used` decimal(5,2) DEFAULT 0.00,
  `year` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_documents`
--

CREATE TABLE `leave_documents` (
  `id` int(11) NOT NULL,
  `leave_id` int(11) NOT NULL,
  `document_type` varchar(50) DEFAULT NULL,
  `document_path` varchar(500) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_employee_permissions`
--

CREATE TABLE `menu_employee_permissions` (
  `id` int(11) NOT NULL,
  `menu_permission_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `view_permission` tinyint(1) DEFAULT 0,
  `add_permission` tinyint(1) DEFAULT 0,
  `edit_permission` tinyint(1) DEFAULT 0,
  `delete_permission` tinyint(1) DEFAULT 0,
  `all_permission` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu_permissions`
--

CREATE TABLE `menu_permissions` (
  `id` int(11) NOT NULL,
  `menu_key` varchar(100) NOT NULL,
  `menu_title` varchar(255) NOT NULL,
  `menu_path` varchar(255) DEFAULT NULL,
  `menu_icon` varchar(100) DEFAULT NULL,
  `parent_menu` varchar(100) DEFAULT NULL,
  `allowed_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`allowed_roles`)),
  `view_permission` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`view_permission`)),
  `add_permission` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`add_permission`)),
  `edit_permission` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`edit_permission`)),
  `delete_permission` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`delete_permission`)),
  `all_permission` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`all_permission`)),
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `id` int(11) NOT NULL,
  `from` varchar(150) NOT NULL,
  `to` varchar(150) NOT NULL,
  `message` varchar(250) NOT NULL,
  `sendDate` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_preferences`
--

CREATE TABLE `notification_preferences` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `notification_type` varchar(50) NOT NULL,
  `email_enabled` tinyint(1) DEFAULT 1,
  `push_enabled` tinyint(1) DEFAULT 1,
  `sms_enabled` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ot_records`
--

CREATE TABLE `ot_records` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `work_detail_id` int(11) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `regular_hours` decimal(5,2) DEFAULT 0.00,
  `ot_hours` decimal(5,2) DEFAULT 0.00,
  `ot_type` varchar(50) DEFAULT NULL,
  `ot_rate` decimal(10,2) DEFAULT NULL,
  `ot_amount` decimal(10,2) DEFAULT NULL,
  `approval_status` varchar(50) DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approverId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ot_rules`
--

CREATE TABLE `ot_rules` (
  `id` int(11) NOT NULL,
  `country` varchar(50) DEFAULT 'UAE',
  `daily_hours_limit` decimal(5,2) DEFAULT 8.00,
  `weekly_hours_limit` decimal(5,2) DEFAULT 48.00,
  `friday_multiplier` decimal(3,2) DEFAULT 1.50,
  `holiday_multiplier` decimal(3,2) DEFAULT 2.00,
  `night_shift_multiplier` decimal(3,2) DEFAULT 1.25,
  `night_shift_start` time DEFAULT '22:00:00',
  `night_shift_end` time DEFAULT '06:00:00',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `reference_number` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `productivity_metrics`
--

CREATE TABLE `productivity_metrics` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `metric_date` date NOT NULL,
  `total_hours` decimal(5,2) DEFAULT 0.00,
  `productive_hours` decimal(5,2) DEFAULT 0.00,
  `idle_time_minutes` int(11) DEFAULT 0,
  `tasks_completed` int(11) DEFAULT 0,
  `tasks_assigned` int(11) DEFAULT 0,
  `productivity_score` decimal(5,2) DEFAULT 0.00,
  `task_completion_rate` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `id` int(150) NOT NULL,
  `tlName` varchar(250) NOT NULL,
  `orderId` varchar(150) DEFAULT NULL,
  `positionNumber` varchar(150) DEFAULT NULL,
  `subPositionNumber` varchar(150) DEFAULT NULL,
  `projectNo` varchar(150) NOT NULL,
  `taskJobNo` varchar(150) DEFAULT NULL,
  `referenceNo` varchar(150) DEFAULT NULL,
  `desciplineCode` varchar(150) NOT NULL,
  `projectName` varchar(150) NOT NULL,
  `subDivision` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `startDate` varchar(150) NOT NULL,
  `targetDate` varchar(150) NOT NULL,
  `allotatedHours` varchar(150) NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `client_id` int(11) DEFAULT NULL,
  `tlID` int(11) DEFAULT NULL,
  `assignedEmployees` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_budgets`
--

CREATE TABLE `project_budgets` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `budget_amount` decimal(10,2) NOT NULL,
  `budget_hours` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'AED',
  `budget_type` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_costs`
--

CREATE TABLE `project_costs` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `cost_date` date NOT NULL,
  `employee_cost` decimal(10,2) DEFAULT 0.00,
  `overhead_cost` decimal(10,2) DEFAULT 0.00,
  `material_cost` decimal(10,2) DEFAULT 0.00,
  `total_cost` decimal(10,2) DEFAULT 0.00,
  `hours_spent` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_plans`
--

CREATE TABLE `project_plans` (
  `id` int(11) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `project_id` int(11) NOT NULL,
  `time_period` enum('weekly','monthly','3_months','6_months','9_months','yearly') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_allotted_hours` decimal(10,2) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('draft','active','completed','cancelled') DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_plan_employees`
--

CREATE TABLE `project_plan_employees` (
  `id` int(11) NOT NULL,
  `project_plan_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `allotted_hours` decimal(10,2) NOT NULL DEFAULT 0.00,
  `assigned_date` date NOT NULL,
  `status` enum('assigned','active','completed','removed') DEFAULT 'assigned',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral_earnings`
--

CREATE TABLE `referral_earnings` (
  `id` int(11) NOT NULL,
  `referrer_user_id` int(11) NOT NULL,
  `referred_user_id` int(11) NOT NULL,
  `investment_id` int(11) NOT NULL,
  `first_investment_amount` decimal(15,2) NOT NULL,
  `referral_amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING_APPROVAL','APPROVED','REJECTED') DEFAULT 'PENDING_APPROVAL',
  `approved_at` timestamp NULL DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_schedules`
--

CREATE TABLE `report_schedules` (
  `id` int(11) NOT NULL,
  `report_type` varchar(100) NOT NULL,
  `report_name` varchar(255) NOT NULL,
  `recipients` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`recipients`)),
  `schedule_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`schedule_config`)),
  `is_active` tinyint(1) DEFAULT 1,
  `last_sent_at` datetime DEFAULT NULL,
  `next_send_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `role_display_name` varchar(255) NOT NULL,
  `role_color` varchar(50) DEFAULT 'default',
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_leads`
--

CREATE TABLE `sales_leads` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `work_email` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_size` varchar(50) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `updateTitle` varchar(255) NOT NULL,
  `UpdateDisc` text DEFAULT NULL,
  `Announcements` tinyint(1) DEFAULT 0,
  `Circular` tinyint(1) DEFAULT 0,
  `Gallery` tinyint(1) DEFAULT 0,
  `ViewExcel` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shifts`
--

CREATE TABLE `shifts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `break_duration` int(11) DEFAULT 0,
  `break_start` time DEFAULT NULL,
  `is_night_shift` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shift_assignments`
--

CREATE TABLE `shift_assignments` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `shift_id` int(11) NOT NULL,
  `assignment_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shift_swaps`
--

CREATE TABLE `shift_swaps` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) NOT NULL,
  `swap_with_id` int(11) NOT NULL,
  `original_shift_date` date NOT NULL,
  `swap_shift_date` date NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `team_lead`
--

CREATE TABLE `team_lead` (
  `id` int(150) NOT NULL,
  `leadName` varchar(250) NOT NULL,
  `teamName` varchar(250) NOT NULL,
  `EMPID` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `trail_version_config`
--

CREATE TABLE `trail_version_config` (
  `id` int(11) NOT NULL,
  `type` enum('company','email') NOT NULL,
  `company_id` int(11) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `days` int(11) NOT NULL DEFAULT 30,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `userName` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variation`
--

CREATE TABLE `variation` (
  `id` int(11) NOT NULL,
  `variation` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `withdrawals`
--

CREATE TABLE `withdrawals` (
  `id` int(11) NOT NULL,
  `investment_id` int(11) NOT NULL,
  `principal_amount` decimal(15,2) NOT NULL,
  `interest_earned` decimal(15,2) NOT NULL DEFAULT 0.00,
  `withdrawal_amount` decimal(15,2) NOT NULL,
  `withdrawn_at` timestamp NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `workdetails`
--

CREATE TABLE `workdetails` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(250) DEFAULT NULL,
  `userName` varchar(250) DEFAULT NULL,
  `referenceNo` varchar(150) DEFAULT NULL,
  `projectName` varchar(250) DEFAULT NULL,
  `tlName` varchar(250) DEFAULT NULL,
  `taskNo` varchar(150) DEFAULT NULL,
  `areaofWork` varchar(250) DEFAULT NULL,
  `variation` varchar(250) DEFAULT NULL,
  `subDivisionList` varchar(250) DEFAULT NULL,
  `subDivision` varchar(250) DEFAULT NULL,
  `monday` varchar(150) DEFAULT NULL,
  `tuesday` varchar(150) DEFAULT NULL,
  `wednesday` varchar(150) DEFAULT NULL,
  `thursday` varchar(150) DEFAULT NULL,
  `friday` varchar(150) DEFAULT NULL,
  `saturday` varchar(150) DEFAULT NULL,
  `sunday` varchar(150) DEFAULT NULL,
  `totalHours` int(150) DEFAULT NULL,
  `weekNumber` varchar(150) DEFAULT NULL,
  `discipline` varchar(150) DEFAULT NULL,
  `status` varchar(150) DEFAULT NULL,
  `sentDate` varchar(150) DEFAULT NULL,
  `approvedDate` varchar(150) DEFAULT NULL,
  `allotatedHours` varchar(150) DEFAULT NULL,
  `desciplineCode` varchar(140) DEFAULT NULL,
  `projectNo` varchar(250) DEFAULT NULL,
  `designation` varchar(230) DEFAULT NULL,
  `employeeNo` varchar(250) DEFAULT NULL,
  `approverId` int(11) DEFAULT NULL,
  `clockInTime` datetime DEFAULT NULL,
  `clockOutTime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `approval_history`
--
ALTER TABLE `approval_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approver_id` (`approver_id`),
  ADD KEY `idx_approval_history_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_approval_history_employee_id` (`employee_id`),
  ADD KEY `idx_approval_history_project_name` (`project_name`);

--
-- Indexes for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `areaofwork`
--
ALTER TABLE `areaofwork`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `areaofwork_projects`
--
ALTER TABLE `areaofwork_projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `areaofwork_id` (`areaofwork_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `billing_rates`
--
ALTER TABLE `billing_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_status` (`user_id`,`status`),
  ADD KEY `idx_start_date` (`start_date`);

--
-- Indexes for table `challenge_days`
--
ALTER TABLE `challenge_days`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_challenge_day` (`challenge_id`,`date`),
  ADD KEY `idx_challenge_date` (`challenge_id`,`date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `challenge_users`
--
ALTER TABLE `challenge_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_phone` (`phone`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `fk_challenge_users_referred_by` (`referred_by_user_id`);

--
-- Indexes for table `challenge_user_settings`
--
ALTER TABLE `challenge_user_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_company_code` (`company_code`);

--
-- Indexes for table `company_billing`
--
ALTER TABLE `company_billing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_invoice_no` (`invoice_no`),
  ADD KEY `idx_bill_company` (`company_id`),
  ADD KEY `idx_bill_status` (`status`);

--
-- Indexes for table `company_menu_permissions`
--
ALTER TABLE `company_menu_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_company_menu` (`company_id`,`menu_key`),
  ADD KEY `idx_cmp_company` (`company_id`);

--
-- Indexes for table `company_menu_trial_settings`
--
ALTER TABLE `company_menu_trial_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_company_menu_trial` (`company_id`,`menu_key`),
  ADD KEY `idx_cmts_company` (`company_id`);

--
-- Indexes for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sub_company` (`company_id`),
  ADD KEY `idx_sub_status` (`status`);

--
-- Indexes for table `company_users`
--
ALTER TABLE `company_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_company_user_email` (`email`),
  ADD KEY `idx_company_users_company` (`company_id`);

--
-- Indexes for table `compoff`
--
ALTER TABLE `compoff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employeeId`),
  ADD KEY `idx_leave_status` (`leaveStatus`);

--
-- Indexes for table `crm_entries`
--
ALTER TABLE `crm_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_crm_date` (`crmDate`),
  ADD KEY `idx_client_name` (`clientName`),
  ADD KEY `idx_created_at` (`createdAt`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `designation`
--
ALTER TABLE `designation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discipline`
--
ALTER TABLE `discipline`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_discipline_code` (`discipline_code`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hr`
--
ALTER TABLE `hr`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `investments`
--
ALTER TABLE `investments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`),
  ADD KEY `idx_maturity` (`maturity_date`),
  ADD KEY `idx_transaction` (`transaction_id`);

--
-- Indexes for table `investment_audit_log`
--
ALTER TABLE `investment_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_action` (`user_id`,`action`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `investment_kyc`
--
ALTER TABLE `investment_kyc`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_status` (`user_id`,`status`);

--
-- Indexes for table `investment_notifications`
--
ALTER TABLE `investment_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_unread` (`user_id`,`read_at`);

--
-- Indexes for table `investment_plans`
--
ALTER TABLE `investment_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_plan` (`category`,`min_amount`,`lockin_days`),
  ADD KEY `idx_category_active` (`category`,`is_active`);

--
-- Indexes for table `investment_withdrawal_requests`
--
ALTER TABLE `investment_withdrawal_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_investment_status` (`investment_id`,`status`),
  ADD KEY `idx_requested_at` (`requested_at`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `idx_invoices_client_status` (`client_id`,`status`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `work_detail_id` (`work_detail_id`);

--
-- Indexes for table `leavedetails`
--
ALTER TABLE `leavedetails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_leave_year` (`employee_id`,`leave_type`,`year`),
  ADD KEY `idx_leave_balance_employee_year` (`employee_id`,`year`);

--
-- Indexes for table `leave_documents`
--
ALTER TABLE `leave_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `leave_id` (`leave_id`);

--
-- Indexes for table `menu_employee_permissions`
--
ALTER TABLE `menu_employee_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_menu_employee` (`menu_permission_id`,`employee_id`),
  ADD KEY `idx_menu_permission_id` (`menu_permission_id`),
  ADD KEY `idx_employee_id` (`employee_id`);

--
-- Indexes for table `menu_permissions`
--
ALTER TABLE `menu_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `menu_key` (`menu_key`),
  ADD KEY `idx_parent_menu` (`parent_menu`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_notification` (`employee_id`,`notification_type`);

--
-- Indexes for table `ot_records`
--
ALTER TABLE `ot_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `work_detail_id` (`work_detail_id`),
  ADD KEY `idx_ot_records_employee_date` (`employee_id`,`attendance_date`);

--
-- Indexes for table `ot_rules`
--
ALTER TABLE `ot_rules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`);

--
-- Indexes for table `productivity_metrics`
--
ALTER TABLE `productivity_metrics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_date` (`employee_id`,`metric_date`),
  ADD KEY `idx_productivity_employee_date` (`employee_id`,`metric_date`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`id`),
  ADD KEY `client_id` (`client_id`);

--
-- Indexes for table `project_budgets`
--
ALTER TABLE `project_budgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `project_costs`
--
ALTER TABLE `project_costs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_costs_project_date` (`project_id`,`cost_date`);

--
-- Indexes for table `project_plans`
--
ALTER TABLE `project_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_project_id` (`project_id`),
  ADD KEY `idx_time_period` (`time_period`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `project_plan_employees`
--
ALTER TABLE `project_plan_employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_plan_employee` (`project_plan_id`,`employee_id`),
  ADD KEY `idx_project_plan_id` (`project_plan_id`),
  ADD KEY `idx_employee_id` (`employee_id`);

--
-- Indexes for table `referral_earnings`
--
ALTER TABLE `referral_earnings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_referral_per_investment` (`investment_id`),
  ADD KEY `referred_user_id` (`referred_user_id`),
  ADD KEY `idx_referrer_status` (`referrer_user_id`,`status`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `report_schedules`
--
ALTER TABLE `report_schedules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indexes for table `sales_leads`
--
ALTER TABLE `sales_leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sales_leads_created_by` (`created_by`),
  ADD KEY `idx_sales_leads_created_at` (`createdAt`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shifts`
--
ALTER TABLE `shifts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shift_assignments`
--
ALTER TABLE `shift_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shift_id` (`shift_id`),
  ADD KEY `idx_shift_assignments_employee_date` (`employee_id`,`assignment_date`);

--
-- Indexes for table `shift_swaps`
--
ALTER TABLE `shift_swaps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `swap_with_id` (`swap_with_id`);

--
-- Indexes for table `team_lead`
--
ALTER TABLE `team_lead`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `trail_version_config`
--
ALTER TABLE `trail_version_config`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `variation`
--
ALTER TABLE `variation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `investment_id` (`investment_id`),
  ADD KEY `idx_withdrawn_at` (`withdrawn_at`);

--
-- Indexes for table `workdetails`
--
ALTER TABLE `workdetails`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `approval_history`
--
ALTER TABLE `approval_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `areaofwork`
--
ALTER TABLE `areaofwork`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `areaofwork_projects`
--
ALTER TABLE `areaofwork_projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing_rates`
--
ALTER TABLE `billing_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenge_days`
--
ALTER TABLE `challenge_days`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenge_users`
--
ALTER TABLE `challenge_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `challenge_user_settings`
--
ALTER TABLE `challenge_user_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_billing`
--
ALTER TABLE `company_billing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_menu_permissions`
--
ALTER TABLE `company_menu_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_menu_trial_settings`
--
ALTER TABLE `company_menu_trial_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_users`
--
ALTER TABLE `company_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `compoff`
--
ALTER TABLE `compoff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `crm_entries`
--
ALTER TABLE `crm_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designation`
--
ALTER TABLE `designation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discipline`
--
ALTER TABLE `discipline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hr`
--
ALTER TABLE `hr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investments`
--
ALTER TABLE `investments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investment_audit_log`
--
ALTER TABLE `investment_audit_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investment_kyc`
--
ALTER TABLE `investment_kyc`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investment_notifications`
--
ALTER TABLE `investment_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investment_plans`
--
ALTER TABLE `investment_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `investment_withdrawal_requests`
--
ALTER TABLE `investment_withdrawal_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leavedetails`
--
ALTER TABLE `leavedetails`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_balances`
--
ALTER TABLE `leave_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leave_documents`
--
ALTER TABLE `leave_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_employee_permissions`
--
ALTER TABLE `menu_employee_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu_permissions`
--
ALTER TABLE `menu_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ot_records`
--
ALTER TABLE `ot_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ot_rules`
--
ALTER TABLE `ot_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productivity_metrics`
--
ALTER TABLE `productivity_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_budgets`
--
ALTER TABLE `project_budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_costs`
--
ALTER TABLE `project_costs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_plans`
--
ALTER TABLE `project_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_plan_employees`
--
ALTER TABLE `project_plan_employees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `referral_earnings`
--
ALTER TABLE `referral_earnings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_schedules`
--
ALTER TABLE `report_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_leads`
--
ALTER TABLE `sales_leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shift_assignments`
--
ALTER TABLE `shift_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shift_swaps`
--
ALTER TABLE `shift_swaps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `team_lead`
--
ALTER TABLE `team_lead`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `trail_version_config`
--
ALTER TABLE `trail_version_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `variation`
--
ALTER TABLE `variation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `withdrawals`
--
ALTER TABLE `withdrawals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `workdetails`
--
ALTER TABLE `workdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval_history`
--
ALTER TABLE `approval_history`
  ADD CONSTRAINT `approval_history_ibfk_1` FOREIGN KEY (`approver_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `areaofwork_projects`
--
ALTER TABLE `areaofwork_projects`
  ADD CONSTRAINT `areaofwork_projects_ibfk_1` FOREIGN KEY (`areaofwork_id`) REFERENCES `areaofwork` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `areaofwork_projects_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `billing_rates`
--
ALTER TABLE `billing_rates`
  ADD CONSTRAINT `billing_rates_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `billing_rates_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `challenges`
--
ALTER TABLE `challenges`
  ADD CONSTRAINT `challenges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `challenge_days`
--
ALTER TABLE `challenge_days`
  ADD CONSTRAINT `challenge_days_ibfk_1` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `challenge_users`
--
ALTER TABLE `challenge_users`
  ADD CONSTRAINT `fk_challenge_users_referred_by` FOREIGN KEY (`referred_by_user_id`) REFERENCES `challenge_users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `challenge_user_settings`
--
ALTER TABLE `challenge_user_settings`
  ADD CONSTRAINT `challenge_user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_billing`
--
ALTER TABLE `company_billing`
  ADD CONSTRAINT `fk_bill_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_menu_permissions`
--
ALTER TABLE `company_menu_permissions`
  ADD CONSTRAINT `fk_cmp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_menu_trial_settings`
--
ALTER TABLE `company_menu_trial_settings`
  ADD CONSTRAINT `fk_cmts_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  ADD CONSTRAINT `fk_sub_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `company_users`
--
ALTER TABLE `company_users`
  ADD CONSTRAINT `fk_company_users_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `investments`
--
ALTER TABLE `investments`
  ADD CONSTRAINT `investments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `challenge_users` (`id`),
  ADD CONSTRAINT `investments_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `investment_plans` (`id`);

--
-- Constraints for table `investment_kyc`
--
ALTER TABLE `investment_kyc`
  ADD CONSTRAINT `investment_kyc_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `investment_notifications`
--
ALTER TABLE `investment_notifications`
  ADD CONSTRAINT `investment_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `investment_withdrawal_requests`
--
ALTER TABLE `investment_withdrawal_requests`
  ADD CONSTRAINT `investment_withdrawal_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `investment_withdrawal_requests_ibfk_2` FOREIGN KEY (`investment_id`) REFERENCES `investments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`work_detail_id`) REFERENCES `workdetails` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  ADD CONSTRAINT `leave_accruals_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_documents`
--
ALTER TABLE `leave_documents`
  ADD CONSTRAINT `leave_documents_ibfk_1` FOREIGN KEY (`leave_id`) REFERENCES `leavedetails` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `menu_employee_permissions`
--
ALTER TABLE `menu_employee_permissions`
  ADD CONSTRAINT `menu_employee_permissions_ibfk_1` FOREIGN KEY (`menu_permission_id`) REFERENCES `menu_permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `menu_employee_permissions_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ot_records`
--
ALTER TABLE `ot_records`
  ADD CONSTRAINT `ot_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ot_records_ibfk_2` FOREIGN KEY (`work_detail_id`) REFERENCES `workdetails` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `productivity_metrics`
--
ALTER TABLE `productivity_metrics`
  ADD CONSTRAINT `productivity_metrics_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project`
--
ALTER TABLE `project`
  ADD CONSTRAINT `project_ibfk_1` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `project_ibfk_2` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `project_ibfk_3` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project_budgets`
--
ALTER TABLE `project_budgets`
  ADD CONSTRAINT `project_budgets_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_costs`
--
ALTER TABLE `project_costs`
  ADD CONSTRAINT `project_costs_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_plans`
--
ALTER TABLE `project_plans`
  ADD CONSTRAINT `project_plans_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_plans_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `employee` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project_plan_employees`
--
ALTER TABLE `project_plan_employees`
  ADD CONSTRAINT `project_plan_employees_ibfk_1` FOREIGN KEY (`project_plan_id`) REFERENCES `project_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_plan_employees_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `referral_earnings`
--
ALTER TABLE `referral_earnings`
  ADD CONSTRAINT `referral_earnings_ibfk_1` FOREIGN KEY (`referrer_user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referral_earnings_ibfk_2` FOREIGN KEY (`referred_user_id`) REFERENCES `challenge_users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `referral_earnings_ibfk_3` FOREIGN KEY (`investment_id`) REFERENCES `investments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shift_assignments`
--
ALTER TABLE `shift_assignments`
  ADD CONSTRAINT `shift_assignments_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_assignments_ibfk_2` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shift_swaps`
--
ALTER TABLE `shift_swaps`
  ADD CONSTRAINT `shift_swaps_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_swaps_ibfk_2` FOREIGN KEY (`swap_with_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `withdrawals`
--
ALTER TABLE `withdrawals`
  ADD CONSTRAINT `withdrawals_ibfk_1` FOREIGN KEY (`investment_id`) REFERENCES `investments` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
