-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 02, 2025 at 06:19 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `signup`
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
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
-- Table structure for table `areaofwork`
--

CREATE TABLE `areaofwork` (
  `id` int(11) NOT NULL,
  `areaofwork` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `areaofwork`
--

INSERT INTO `areaofwork` (`id`, `areaofwork`, `created_at`, `updated_at`) VALUES
(1, 'Design', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(3, 'Planning', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(16, 'Documentation', '2025-12-02 16:47:47', '2025-12-02 16:47:47'),
(17, 'Development', '2025-12-02 16:48:14', '2025-12-02 16:48:14'),
(18, 'Qa', '2025-12-02 16:48:20', '2025-12-02 16:48:20'),
(19, 'Marketing', '2025-12-02 16:48:30', '2025-12-02 16:48:30'),
(20, 'Editing', '2025-12-02 16:52:57', '2025-12-02 16:52:57');

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
-- Table structure for table `designation`
--

CREATE TABLE `designation` (
  `id` int(11) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `designation`
--

INSERT INTO `designation` (`id`, `designation`, `created_at`, `updated_at`) VALUES
(1, 'Engineer', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(2, 'Senior Engineer', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(3, 'Project Manager', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(4, 'Team Lead', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(5, 'Architect', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(6, 'Designer', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(19, 'Hr', '2025-12-02 16:47:33', '2025-12-02 16:47:33'),
(20, 'Editor', '2025-12-02 16:52:35', '2025-12-02 16:52:35');

-- --------------------------------------------------------

--
-- Table structure for table `discipline`
--

CREATE TABLE `discipline` (
  `id` int(11) NOT NULL,
  `discipline` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `discipline`
--

INSERT INTO `discipline` (`id`, `discipline`, `created_at`, `updated_at`) VALUES
(1, 'Civil Engineering', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(2, 'Mechanical Engineering', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(3, 'Electrical Engineering', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(4, 'Architecture', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(5, 'Project Management', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(16, 'Software Engineer', '2025-12-02 16:32:13', '2025-12-02 16:32:13'),
(17, 'Video Editor', '2025-12-02 16:52:26', '2025-12-02 16:52:26');

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
  `employeeStatus` varchar(160) NOT NULL,
  `id` int(11) NOT NULL,
  `relievingDate` date DEFAULT NULL,
  `permanentDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`employeeName`, `EMPID`, `employeeEmail`, `userName`, `password`, `role`, `discipline`, `designation`, `date`, `employeeImage`, `employeeStatus`, `id`, `relievingDate`, `permanentDate`) VALUES
('Admin', 122, 'admin@arris.com', 'admin@arris.com', '$2b$10$1s38avVk64aZccZuJwsVmedfTXP7gYfBEwzCGNQGed09cbpuRTQIG', 'Admin', '10', '10', '2023-08-04', 'employeeImage_1693244431413.jpg', '', 9, NULL, NULL),
('Arul kumar', 1, 'arulkumar8270@gmail.com', 'arulkumar8270', '$2b$10$EM4ov0AkCvSl.vRsiylKlu9pQ1qHvc7WcrkCbEJOaNfH89Rie3soa', 'TL', 'Project Management', 'Project Manager', '2021-12-02', 'default-image-filename.jpg', 'Permanent', 23, NULL, NULL),
('Balkis', 2, 'balkis@nicknameinfotech.com', 'balkis@123', '$2b$10$DOo9pC3JPRNhPao5agSL7.d/fnq1hveaZ4naIk.QqvXT0oL7X8yES', 'HR', 'Software Engineer', 'Hr', '2025-10-01', 'default-image-filename.jpg', 'Permanent', 24, NULL, NULL),
('Sadh', 3, 'Sadh@nicknameinfotech.com', 'Sadh@123', '$2b$10$qao9li1cT..0locHfsvrRuh7rJG4DvnXioGJmg1shOSxfBSO03Bp2', 'Employee', 'Software Engineer', 'Engineer', '2025-10-01', 'default-image-filename.jpg', 'Probation', 25, NULL, NULL),
('Nishanth', 4, 'nishanth@nicknameinfotech.com', 'nishanth@123', '$2b$10$RkghRQZalbPdw0sCiKDuueKPTvQMh1SdUr0P45NJG4DjiskPqMCLi', 'Employee', 'Video Editor', 'Editor', '2025-10-01', 'default-image-filename.jpg', 'Probation', 26, NULL, NULL);

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

--
-- Dumping data for table `leave_balances`
--

INSERT INTO `leave_balances` (`id`, `employee_id`, `leave_type`, `balance`, `accrued`, `used`, `year`, `created_at`, `updated_at`) VALUES
(15, 9, 'annual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:04:31', '2025-12-02 17:04:31'),
(16, 9, 'sick', 6.00, 6.00, 0.00, 2025, '2025-12-02 17:04:54', '2025-12-02 17:04:54'),
(17, 9, 'casual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:05:09', '2025-12-02 17:05:09'),
(18, 9, 'emergency', 4.00, 4.00, 0.00, 2025, '2025-12-02 17:05:15', '2025-12-02 17:05:15'),
(19, 23, 'annual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:10:25', '2025-12-02 17:10:25'),
(20, 23, 'sick', 6.00, 6.00, 0.00, 2025, '2025-12-02 17:10:33', '2025-12-02 17:10:33'),
(21, 23, 'casual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:10:42', '2025-12-02 17:10:42'),
(22, 23, 'emergency', 4.00, 4.00, 0.00, 2025, '2025-12-02 17:10:50', '2025-12-02 17:10:50'),
(23, 24, 'emergency', 4.00, 4.00, 0.00, 2025, '2025-12-02 17:11:01', '2025-12-02 17:11:01'),
(24, 24, 'casual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:11:09', '2025-12-02 17:11:09'),
(25, 24, 'sick', 6.00, 6.00, 0.00, 2025, '2025-12-02 17:11:16', '2025-12-02 17:11:16'),
(26, 24, 'annual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:11:33', '2025-12-02 17:11:33'),
(27, 25, 'annual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:11:44', '2025-12-02 17:11:44'),
(28, 25, 'sick', 6.00, 6.00, 0.00, 2025, '2025-12-02 17:11:50', '2025-12-02 17:11:50'),
(29, 25, 'casual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:11:57', '2025-12-02 17:11:57'),
(30, 25, 'emergency', 4.00, 4.00, 0.00, 2025, '2025-12-02 17:12:05', '2025-12-02 17:12:05'),
(31, 26, 'annual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:12:16', '2025-12-02 17:12:16'),
(32, 26, 'sick', 6.00, 6.00, 0.00, 2025, '2025-12-02 17:12:55', '2025-12-02 17:12:55'),
(33, 26, 'casual', 12.00, 12.00, 0.00, 2025, '2025-12-02 17:13:03', '2025-12-02 17:13:03'),
(34, 26, 'emergency', 4.00, 4.00, 0.00, 2025, '2025-12-02 17:13:09', '2025-12-02 17:13:09');

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

--
-- Dumping data for table `productivity_metrics`
--

INSERT INTO `productivity_metrics` (`id`, `employee_id`, `metric_date`, `total_hours`, `productive_hours`, `idle_time_minutes`, `tasks_completed`, `tasks_assigned`, `productivity_score`, `task_completion_rate`, `created_at`) VALUES
(5, 23, '2025-12-02', 0.00, 0.00, 480, 0, 0, 0.00, 0.00, '2025-12-02 17:08:47');

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `id` int(150) NOT NULL,
  `tlName` varchar(250) NOT NULL,
  `orderId` varchar(150) NOT NULL,
  `positionNumber` varchar(150) NOT NULL,
  `subPositionNumber` varchar(150) NOT NULL,
  `projectNo` varchar(150) NOT NULL,
  `taskJobNo` varchar(150) NOT NULL,
  `referenceNo` varchar(150) NOT NULL,
  `desciplineCode` varchar(150) NOT NULL,
  `projectName` varchar(150) NOT NULL,
  `subDivision` varchar(150) NOT NULL,
  `startDate` varchar(150) NOT NULL,
  `targetDate` varchar(150) NOT NULL,
  `allotatedHours` varchar(150) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `tlID` int(11) DEFAULT NULL,
  `assignedEmployees` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`id`, `tlName`, `orderId`, `positionNumber`, `subPositionNumber`, `projectNo`, `taskJobNo`, `referenceNo`, `desciplineCode`, `projectName`, `subDivision`, `startDate`, `targetDate`, `allotatedHours`, `client_id`, `tlID`, `assignedEmployees`) VALUES
(14, 'Arul kumar', '001', '1', '2', '001', '001', '001', '001', 'Timmins', 'Website Development', '2025-12-03', '2025-12-10', '48', NULL, 23, '[25,23]'),
(15, 'Arul kumar', '002', '2', '002', '002', '002', '002', '002', 'Ibss-Rheincs', 'Html to Next js', '2025-11-07', '2025-12-05', '48', NULL, 23, '[25,23]'),
(16, 'Arul kumar', '003', '3', '003', '003', '003', '003', '003', 'Time Sheet Management', 'Nickname Product', '2025-11-19', '2025-12-05', '128', NULL, 23, '[24,23]'),
(17, 'Arul kumar', '003', '4', '004', '004', '004', '004', '003', 'Nickname Portal', 'Nickname Product', '2021-12-01', '2025-12-31', '300', NULL, 23, '[24,23]');

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

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `updateTitle`, `UpdateDisc`, `Announcements`, `Circular`, `Gallery`, `ViewExcel`, `created_at`, `updated_at`) VALUES
(2, 'New update', 'New update', 1, 1, 1, 1, '2025-11-26 07:54:10', '2025-11-26 07:54:10');

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

--
-- Dumping data for table `shifts`
--

INSERT INTO `shifts` (`id`, `name`, `start_time`, `end_time`, `break_duration`, `break_start`, `is_night_shift`, `is_active`, `created_at`, `updated_at`) VALUES
(7, 'General', '10:00:00', '19:00:00', 60, NULL, 0, 1, '2025-12-02 17:06:09', '2025-12-02 17:06:09'),
(8, 'Night Shift', '22:00:00', '13:00:00', 60, NULL, 0, 1, '2025-12-02 17:08:28', '2025-12-02 17:08:28');

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

--
-- Dumping data for table `shift_assignments`
--

INSERT INTO `shift_assignments` (`id`, `employee_id`, `shift_id`, `assignment_date`, `end_date`, `is_active`, `created_at`, `updated_at`) VALUES
(6, 23, 7, '2025-12-01', NULL, 1, '2025-12-02 17:06:28', '2025-12-02 17:06:28'),
(7, 24, 7, '2025-12-01', NULL, 1, '2025-12-02 17:06:37', '2025-12-02 17:06:37'),
(8, 25, 7, '2025-12-01', NULL, 1, '2025-12-02 17:06:43', '2025-12-02 17:06:43'),
(9, 26, 7, '2025-12-01', NULL, 1, '2025-12-02 17:06:48', '2025-12-02 17:06:48');

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
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `userName` varchar(250) NOT NULL,
  `password` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `userName`, `password`) VALUES
(1, 'admin@gmail.com', '12345');

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

--
-- Dumping data for table `variation`
--

INSERT INTO `variation` (`id`, `variation`, `created_at`, `updated_at`) VALUES
(1, 'Original', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(2, 'Variation 1', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(3, 'Variation 2', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(4, 'Revision', '2025-11-20 12:43:49', '2025-11-20 12:43:49'),
(5, 'Amendment', '2025-11-20 12:43:49', '2025-11-20 12:43:49');

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
  `approverId` int(11) DEFAULT NULL
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
  ADD KEY `idx_approval_history_entity` (`entity_type`,`entity_id`);

--
-- Indexes for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `areaofwork`
--
ALTER TABLE `areaofwork`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `billing_rates`
--
ALTER TABLE `billing_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `compoff`
--
ALTER TABLE `compoff`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_employee_id` (`employeeId`),
  ADD KEY `idx_leave_status` (`leaveStatus`);

--
-- Indexes for table `designation`
--
ALTER TABLE `designation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discipline`
--
ALTER TABLE `discipline`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `report_schedules`
--
ALTER TABLE `report_schedules`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `approval_workflows`
--
ALTER TABLE `approval_workflows`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `areaofwork`
--
ALTER TABLE `areaofwork`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `billing_rates`
--
ALTER TABLE `billing_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `compoff`
--
ALTER TABLE `compoff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `designation`
--
ALTER TABLE `designation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `discipline`
--
ALTER TABLE `discipline`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `hr`
--
ALTER TABLE `hr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leavedetails`
--
ALTER TABLE `leavedetails`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `leave_accruals`
--
ALTER TABLE `leave_accruals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `leave_balances`
--
ALTER TABLE `leave_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `leave_documents`
--
ALTER TABLE `leave_documents`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `productivity_metrics`
--
ALTER TABLE `productivity_metrics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

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
-- AUTO_INCREMENT for table `report_schedules`
--
ALTER TABLE `report_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `shifts`
--
ALTER TABLE `shifts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `shift_assignments`
--
ALTER TABLE `shift_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `shift_swaps`
--
ALTER TABLE `shift_swaps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `team_lead`
--
ALTER TABLE `team_lead`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `variation`
--
ALTER TABLE `variation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `workdetails`
--
ALTER TABLE `workdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `approval_history`
--
ALTER TABLE `approval_history`
  ADD CONSTRAINT `approval_history_ibfk_1` FOREIGN KEY (`approver_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `billing_rates`
--
ALTER TABLE `billing_rates`
  ADD CONSTRAINT `billing_rates_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `billing_rates_ibfk_2` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE SET NULL;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
