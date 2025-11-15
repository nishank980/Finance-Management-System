CREATE DATABASE IF NOT EXISTS transaction_db;
USE transaction_db;

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  date BIGINT NOT NULL,
  createdAt BIGINT DEFAULT (UNIX_TIMESTAMP())
);