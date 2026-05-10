-- ==============================================
-- RESET + RE-INSERT orders (xoa data cu, insert data moi)
-- Database: profile_service
-- ==============================================

USE profile_service;

SET FOREIGN_KEY_CHECKS = 0;

-- Xoa toan bo order_items va orders cu
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;

SET FOREIGN_KEY_CHECKS = 1;

-- Sau do chay tiep file seed_orders.sql:
-- SOURCE seed_orders.sql;
-- Hoac chay 2 lenh rieng biet:
--   mysql -u root -p profile_service < reset_orders.sql
--   mysql -u root -p profile_service < seed_orders.sql
