-- ================================================
-- AI Chatbot Service - Database Schema
-- ================================================
-- This schema should be applied to the existing 'doan' database

USE doan;

-- ================================================
-- Chatbot Conversations Table
-- ================================================
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    title VARCHAR(255),
    status ENUM('ACTIVE', 'ARCHIVED') DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraint (assumes 'users' table exists with 'id' column)
    -- If users table has different structure, adjust accordingly
    -- CONSTRAINT fk_conv_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user_status (user_id, status),
    INDEX idx_updated (updated_at),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Chatbot Messages Table
-- ================================================
CREATE TABLE IF NOT EXISTS chatbot_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    role ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    content TEXT NOT NULL,
    product_ids JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT fk_msg_conv FOREIGN KEY (conversation_id)
        REFERENCES chatbot_conversations(id) ON DELETE CASCADE,

    INDEX idx_conv_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Chatbot Response Cache Table
-- ================================================
CREATE TABLE IF NOT EXISTS chatbot_response_cache (
    cache_key VARCHAR(64) PRIMARY KEY,
    query_normalized VARCHAR(500),
    response_text TEXT NOT NULL,
    product_ids JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    hit_count INT UNSIGNED DEFAULT 0 NOT NULL,

    INDEX idx_expires (expires_at),
    INDEX idx_hit_count (hit_count),
    INDEX idx_query_prefix (query_normalized(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Chatbot Rate Limits Table
-- ================================================
CREATE TABLE IF NOT EXISTS chatbot_rate_limits (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(100) NOT NULL,
    identifier_type ENUM('USER', 'IP') NOT NULL,
    window_start TIMESTAMP NOT NULL,
    request_count INT UNSIGNED DEFAULT 0 NOT NULL,

    UNIQUE KEY uq_ratelimit (identifier, identifier_type, window_start),
    INDEX idx_window (window_start),
    INDEX idx_identifier (identifier, identifier_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Product Service Indexes for Performance
-- (Only add if they don't already exist)
-- ================================================

-- Full-text search index on products
-- Check first: SHOW INDEX FROM products;
-- If ft_product_search doesn't exist, create it:
-- ALTER TABLE products ADD FULLTEXT INDEX ft_product_search (name, description);

-- Price range index
-- ALTER TABLE products ADD INDEX idx_price_range (price_sale, status);

-- Brand and category index
-- ALTER TABLE products ADD INDEX idx_brand_category (brand_id, status);

-- Variant specs index
-- ALTER TABLE product_variants ADD INDEX idx_specs (ram_gb, storage_gb, price_list);

-- ================================================
-- Optional: Conversation Summaries Table
-- (For future implementation of conversation summarization)
-- ================================================
CREATE TABLE IF NOT EXISTS chatbot_conversation_summaries (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    summary TEXT NOT NULL,
    from_message_id BIGINT UNSIGNED,
    to_message_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    CONSTRAINT fk_summary_conv FOREIGN KEY (conversation_id)
        REFERENCES chatbot_conversations(id) ON DELETE CASCADE,

    INDEX idx_conv_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- Verify Schema
-- ================================================
SELECT 'Schema created successfully!' AS status;

SHOW TABLES LIKE 'chatbot_%';
