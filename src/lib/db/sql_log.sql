CREATE TABLE IF NOT EXISTS login_details (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255)  NOT NULL,
  email      VARCHAR(255)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  role       ENUM(
               'SUPERADMIN',
               'ADMIN',
               'COMPANY',
               'COMPANYCHILD',
               'VENDOR',
               'VENDORCHILD'
             ) NOT NULL DEFAULT 'ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
