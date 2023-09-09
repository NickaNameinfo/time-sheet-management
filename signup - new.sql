-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 09, 2023 at 12:27 PM
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
('testemp', 978987, 'testemp@hkj.kh', 'testemp222', '$2b$10$kUHA7RJ5zuBz5ZQPgTL43eC8SCzbH/wONthuMsdJN15.Xws.Aq4zG', 'Admin', '10', '10', '2023-09-09', 'employeeImage_1694245453193.png', 'Probation', 10),
('32542323', 233, '232@dsad.sdf', 'testemp22', '$2b$10$oRaC5QzxrxuFTAY78TUTFOkZiPnxiR9ev8aMmeqDn7R4u7UVrNSG.', 'Employee', '20', '20', '2023-09-09', 'employeeImage_1694246233035.png', 'Traning', 11),
('tlemp', 77865, 'tlemp@d.sdf', 'tlemp', '$2b$10$MaLCxvz.vK/cystYF0xJe.YJ5dHZIQR1hzynB2Ug2T6P/zgYkHR9W', 'Tl', '10', '10', '2023-09-01', 'employeeImage_1694246329583.png', 'Probation', 12);

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

--
-- Dumping data for table `hr`
--

INSERT INTO `hr` (`id`, `hrName`, `userName`, `password`) VALUES
(1, '20', 'sdfasd', '$2b$10$ItrNuGbXvPEiBfy7KG0oU.dcczq21mbzPHVmjG8xLAqE3rOn//GkS'),
(2, '10', 'test', '$2b$10$GaK2iOHkQtBYKKO82kv9ierO7MzzNfCj.xQEnIYnyC12ErNVBqgy6'),
(3, '20', 'hr@test.com', '$2b$10$7VaBZuI35iDUcIpXv7qnT.lCD8hYRgEdVzjOLpGS5N3NPwdrzObSi'),
(4, '20', 'hr@test.com', '$2b$10$LuNXIxsehlj1ma1P.xkf5ODZCr16kZwURo/Ypir1lFlaTEIf.u.tW');

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
(7, 'Vecation', '2023-09-07', '2023-09-08', '1', 'test', '', 'test@123.com', ''),
(8, 'Sick Leave', '2023-09-14', '2023-09-15', '1', 'aklfdjsa', '', 'test@123.com', ''),
(9, 'Vecation', '2023-09-16', '2023-09-09', '7', 'test', '', 'test@123.com', '');

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
(8, 'test', '3412341', '234122', '123412331', '1234123', '34123', '324123', '09876', '1234123', '1234123', '2023-09-28', '2023-09-26', '12'),
(9, 'Admin', '123456', '123456', '123545', '98765', '9876', '9867', '09876', 'test', 'abcd, zyx', '2023-09-22', '2023-09-30', '50');

-- --------------------------------------------------------

--
-- Table structure for table `team_lead`
--

CREATE TABLE `team_lead` (
  `id` int(150) NOT NULL,
  `leadName` varchar(250) NOT NULL,
  `teamName` varchar(250) NOT NULL,
  `userName` varchar(150) NOT NULL,
  `password` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `team_lead`
--

INSERT INTO `team_lead` (`id`, `leadName`, `teamName`, `userName`, `password`) VALUES
(7, 'Arul', 'testing', 'testingteam@arris', '$2b$10$bBBs7F4AyKiYBy0UmIJB5uMygLH6h/O/nllnIHTKwnNO1rdAFbCRS'),
(8, 'test', 'test lead', 'lead', '$2b$10$D8QqVOvOCOdFN8.CVikw1OHl5DAf22vvZFwpHptdtbS8fl49w6Si2');

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
(50, 'Admin', 'admin@arris.com', '324123', '1234123', 'test', '34123', 'Ui', 'Ui', '1234123', '1234123', '1', '1', '1', '1', '1', '1', '1', 7, '35', '10', '', '2022-09-03T11:47:42.337Z', '', '12', '09876'),
(51, 'Admin', 'admin@arris.com', '324123', '1234123', 'test', '34123', 'Ui', 'Ui', '1234123', '1234123', '1', '1', '1', '1', '1', '1', '1', 7, '36', '10', '', '2023-09-03T11:47:42.337Z', '', '12', '09877'),
(56, 'Admin', 'admin@arris.com', '9867', 'test', 'Admin', '9876', 'Ui', 'Ui', 'abcd, zyx', 'abcd', '1', '1', '1', '1', '1', '1', '4', 10, '36', '10', '', '2023-09-07T18:54:51.545Z', '', '50', '09876'),
(57, 'Admin', 'admin@arris.com', '9867', 'test', 'Admin', '9876', 'Ui', 'Ui', 'abcd, zyx', ' zyx', '1', '1', '1', '1', '1', '1', '1', 7, '35', '10', '', '2023-08-07T18:58:21.030Z', '', '50', '09876'),
(58, 'Admin', 'admin@arris.com', '9867', 'test', 'Admin', '9876', 'Ui', 'Ui', 'abcd, zyx', 'abcd', '-1', '1', '111', '1', '1', '1', '1', 115, '36', '10', '', '2023-09-09T06:11:04.341Z', '', '50', '09876');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `hr`
--
ALTER TABLE `hr`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `leavedetails`
--
ALTER TABLE `leavedetails`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `team_lead`
--
ALTER TABLE `team_lead`
  MODIFY `id` int(150) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `workdetails`
--
ALTER TABLE `workdetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
