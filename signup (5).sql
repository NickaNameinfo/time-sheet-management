-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 13, 2023 at 01:30 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.0.25

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
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employee`
--

INSERT INTO `employee` (`employeeName`, `EMPID`, `employeeEmail`, `userName`, `password`, `role`, `discipline`, `designation`, `date`, `employeeImage`, `employeeStatus`, `id`) VALUES
('Admin', 122, 'admin@arris.com', 'admin@arris.com', '$2b$10$1s38avVk64aZccZuJwsVmedfTXP7gYfBEwzCGNQGed09cbpuRTQIG', 'Admin', '10', '10', '2023-08-04', 'employeeImage_1693244431413.jpg', '', 9),
('Tl_user', 12345, 'tluser@123.com', 'tl-user', '$2b$10$WkOabFMIn3buol60jeZXIOxB0fmKrT27kLSbgzzOpTk1AddysBr/a', 'Tl', '10', '20', '2022-09-12', 'employeeImage_1694541149785.jpg', 'Traning', 14),
('Employee', 1234567, 'employee@123.com', 'employee-user', '$2b$10$UO9ff20B3NVYPnF3eBRnk.aJPCSBGrNKt/dNF53rAbC.ydnlmI6oy', 'Employee', '20', '30', '2023-05-10', 'employeeImage_1694541242165.jpg', 'Probation', 15),
('Employee1', 12345678, 'Employee11@123.com', 'employee1-user', '$2b$10$d7XjnqraELWs/ZBGeZ8WzOjXi/.ugDLMggFLN8cyrQmymaEkxD59y', 'Employee', '30', '30', '2023-09-12', 'employeeImage_1694541314470.jpg', 'Permanent', 16),
('tl_user2', 12345678, 'tl-user2@123.com', 'tl-user1', '$2b$10$7wdbSDKDkFczSXlNT0bB8ugAxA4nfyYfx1VLSvNVOSOdh5JM1Ecfi', 'Tl', '10', '10', '2017-09-12', 'employeeImage_1694541430679.jpg', 'Permanent', 17);

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
-- Table structure for table `leavedetails`
--

CREATE TABLE `leavedetails` (
  `id` int(150) NOT NULL,
  `leaveType` varchar(150) NOT NULL,
  `leaveFrom` varchar(150) NOT NULL,
  `leaveTo` varchar(150) NOT NULL,
  `leaveHours` varchar(150) NOT NULL,
  `reason` varchar(250) NOT NULL,
  `leaveStatus` varchar(150) NOT NULL,
  `employeeName` varchar(250) NOT NULL,
  `totalLeaves` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leavedetails`
--

INSERT INTO `leavedetails` (`id`, `leaveType`, `leaveFrom`, `leaveTo`, `leaveHours`, `reason`, `leaveStatus`, `employeeName`, `totalLeaves`) VALUES
(11, 'Vecation', '2023-09-13', '2023-09-14', '1', 'test', '', 'employee-user', '');

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
  `allotatedHours` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`id`, `tlName`, `orderId`, `positionNumber`, `subPositionNumber`, `projectNo`, `taskJobNo`, `referenceNo`, `desciplineCode`, `projectName`, `subDivision`, `startDate`, `targetDate`, `allotatedHours`) VALUES
(10, 'Tl_user', '12345', '2', '1', '118', '1230', '12', '12345', 'TestProject', 'testDivision', '2022-09-12', '2023-09-12', '50');

-- --------------------------------------------------------

--
-- Table structure for table `team_lead`
--

CREATE TABLE `team_lead` (
  `id` int(150) NOT NULL,
  `leadName` varchar(250) NOT NULL,
  `teamName` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_lead`
--

INSERT INTO `team_lead` (`id`, `leadName`, `teamName`) VALUES
(11, 'Tl_user', 'test team');

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
-- Table structure for table `workdetails`
--

CREATE TABLE `workdetails` (
  `id` int(11) NOT NULL,
  `employeeName` varchar(250) NOT NULL,
  `userName` varchar(250) NOT NULL,
  `referenceNo` varchar(150) NOT NULL,
  `projectName` varchar(250) NOT NULL,
  `tlName` varchar(250) NOT NULL,
  `taskNo` varchar(150) NOT NULL,
  `areaofWork` varchar(250) NOT NULL,
  `variation` varchar(250) NOT NULL,
  `subDivisionList` varchar(250) NOT NULL,
  `subDivision` varchar(250) NOT NULL,
  `monday` varchar(150) NOT NULL,
  `tuesday` varchar(150) NOT NULL,
  `wednesday` varchar(150) NOT NULL,
  `thursday` varchar(150) NOT NULL,
  `friday` varchar(150) NOT NULL,
  `saturday` varchar(150) NOT NULL,
  `sunday` varchar(150) NOT NULL,
  `totalHours` int(150) NOT NULL,
  `weekNumber` varchar(150) NOT NULL,
  `discipline` varchar(150) NOT NULL,
  `status` varchar(150) NOT NULL,
  `sentDate` varchar(150) NOT NULL,
  `approvedDate` varchar(150) NOT NULL,
  `allotatedHours` varchar(150) NOT NULL,
  `desciplineCode` varchar(140) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `workdetails`
--

INSERT INTO `workdetails` (`id`, `employeeName`, `userName`, `referenceNo`, `projectName`, `tlName`, `taskNo`, `areaofWork`, `variation`, `subDivisionList`, `subDivision`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`, `totalHours`, `weekNumber`, `discipline`, `status`, `sentDate`, `approvedDate`, `allotatedHours`, `desciplineCode`) VALUES
(60, 'Employee', 'employee-user', '12', 'TestProject', 'Tl_user', '1230', 'Ui', 'Ui', 'testDivision', 'testDivision', '1', '1', '1', '1', '1', '1', '1', 7, '37', '20', 'approved', '2023-09-12T19:16:29.949Z', '2023-09-12T19:21:42.351Z', '50', '12345'),
(61, 'Employee', 'employee-user', '12', 'TestProject', 'Tl_user', '1230', 'Ui', 'Ui', 'testDivision', 'testDivision', '1', '1', '1', '1', '1', '1', '1', 7, '37', '20', 'rejected', '2023-09-12T19:19:08.556Z', '2023-09-12T19:22:55.330Z', '50', '12345');

--
-- Indexes for dumped tables
--

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
-- Indexes for table `leavedetails`
--
ALTER TABLE `leavedetails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `workdetails`
--
ALTER TABLE `workdetails`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `hr`
--
ALTER TABLE `hr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leavedetails`
--
ALTER TABLE `leavedetails`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `team_lead`
--
ALTER TABLE `team_lead`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `workdetails`
--
ALTER TABLE `workdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
