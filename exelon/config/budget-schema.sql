CREATE DATABASE IF NOT EXISTS budget_db;
USE budget_db;

CREATE TABLE budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  category VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month BIGINT NOT NULL,
  createdAt BIGINT DEFAULT (UNIX_TIMESTAMP()),
  UNIQUE KEY unique_user_category_month (userId, category, month)
);