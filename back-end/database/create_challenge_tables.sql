-- Public users for Daily Challenge & Todo app (separate from employee/hr)
CREATE TABLE IF NOT EXISTS challenge_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  age INT NULL,
  gender ENUM('Male', 'Female', 'Other') NULL,
  location VARCHAR(500) NULL COMMENT 'lat,lng or place name',
  address TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_email (email)
);

-- Challenges created by users
CREATE TABLE IF NOT EXISTS challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  total_days INT NOT NULL,
  start_date DATE NOT NULL,
  reminder_time TIME NULL COMMENT 'Daily reminder time (e.g. 09:00)',
  status ENUM('active', 'completed', 'archived') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES challenge_users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_start_date (start_date)
);

-- One row per day per challenge (auto-generated when challenge is created)
CREATE TABLE IF NOT EXISTS challenge_days (
  id INT AUTO_INCREMENT PRIMARY KEY,
  challenge_id INT NOT NULL,
  day_number INT NOT NULL,
  date DATE NOT NULL,
  day_name VARCHAR(20) NOT NULL COMMENT 'Monday, Tuesday, etc.',
  status ENUM('pending', 'completed', 'missed') DEFAULT 'pending',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_challenge_day (challenge_id, date),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
  INDEX idx_challenge_date (challenge_id, date),
  INDEX idx_status (status)
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS challenge_user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  reminder_enabled TINYINT(1) DEFAULT 1,
  eod_reminder_enabled TINYINT(1) DEFAULT 1,
  missed_alert_enabled TINYINT(1) DEFAULT 1,
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES challenge_users(id) ON DELETE CASCADE
);
