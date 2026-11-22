-- Hostinger MySQL schema for BudyBear.
-- Run against an empty (or new) database. CREATE TABLE IF NOT EXISTS will not
-- overwrite existing tables. Default charset is utf8mb4.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  password_algo VARCHAR(32) NULL,
  password_needs_reset TINYINT(1) NOT NULL DEFAULT 1,
  email_confirmed_at DATETIME(3) NULL,
  last_sign_in_at DATETIME(3) NULL,
  raw_user_meta JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NULL,
  phone VARCHAR(64) NULL,
  address TEXT NULL,
  city VARCHAR(128) NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'customer',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY profiles_email_unique (email),
  CONSTRAINT profiles_user_fk FOREIGN KEY (id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  used_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY password_reset_token_hash (token_hash),
  KEY password_reset_user_idx (user_id),
  CONSTRAINT password_reset_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image TEXT NULL,
  image_url TEXT NULL,
  subcategories JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  seo JSON NULL,
  subcategory_seo JSON NULL,
  banner JSON NULL,
  subcategory_banners JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY categories_slug_unique (slug),
  KEY categories_is_active_idx (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  subcategory VARCHAR(255) NOT NULL DEFAULT '',
  subcategories JSON NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2) NULL,
  compare_at_price DECIMAL(12,2) NULL,
  sku VARCHAR(128) NULL,
  images JSON NOT NULL,
  color_images JSON NOT NULL,
  color_swatches JSON NOT NULL,
  sizes JSON NOT NULL,
  colors JSON NOT NULL,
  variant_stock JSON NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  review_count INT NOT NULL DEFAULT 0,
  brand VARCHAR(128) NOT NULL DEFAULT 'Budy Bear',
  featured TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  new_arrival TINYINT(1) NOT NULL DEFAULT 0,
  best_seller TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  seo JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY products_slug_unique (slug),
  UNIQUE KEY products_sku_unique (sku),
  KEY products_category_idx (category_id),
  KEY products_is_active_idx (is_active),
  KEY products_is_featured_idx (is_featured),
  KEY products_created_at_idx (created_at),
  CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NULL,
  items JSON NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(12,2) NULL,
  total DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NULL,
  delivery_method VARCHAR(32) NOT NULL,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cod',
  payment_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  order_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  shipping_address JSON NOT NULL,
  shipping_address_text TEXT NULL,
  customer JSON NOT NULL,
  customer_name VARCHAR(255) NULL,
  customer_email VARCHAR(255) NULL,
  customer_phone VARCHAR(64) NULL,
  city VARCHAR(128) NULL,
  postal_code VARCHAR(32) NULL,
  notes TEXT NOT NULL,
  coupon_code VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY orders_user_idx (user_id),
  KEY orders_status_idx (order_status),
  KEY orders_created_idx (created_at),
  CONSTRAINT orders_user_fk FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id BIGINT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(12,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY order_items_order_idx (order_id),
  KEY order_items_product_idx (product_id),
  CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT order_items_product_fk FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(255) NULL,
  author VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NULL,
  user_id CHAR(36) NULL,
  rating INT NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  comment TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  is_testimonial TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY reviews_product_idx (product_id),
  KEY reviews_user_idx (user_id),
  KEY reviews_created_idx (created_at),
  KEY reviews_testimonial_idx (is_testimonial, created_at),
  CONSTRAINT reviews_product_fk FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT reviews_user_fk FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlists (
  user_id CHAR(36) NOT NULL,
  product_id BIGINT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT wishlists_user_fk FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT wishlists_product_fk FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  label VARCHAR(255) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL,
  min_order DECIMAL(12,2) NOT NULL DEFAULT 0,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY coupons_code_unique (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS banners (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image TEXT NOT NULL,
  mobile_image TEXT NULL,
  href VARCHAR(512) NOT NULL DEFAULT '/products',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_settings (
  id INT NOT NULL PRIMARY KEY,
  store_name VARCHAR(255) NOT NULL DEFAULT 'Budy Bear',
  announcement TEXT NOT NULL,
  support_email VARCHAR(255) NOT NULL DEFAULT 'support@budybear.com',
  support_phone VARCHAR(64) NOT NULL DEFAULT '+92 333 0370236',
  seasonal_collection VARCHAR(32) NOT NULL DEFAULT 'winter',
  legal_pages JSON NOT NULL,
  offer JSON NOT NULL,
  seasonal_banner JSON NOT NULL,
  seo JSON NOT NULL,
  delivery_fee DECIMAL(12,2) NULL,
  free_delivery_threshold DECIMAL(12,2) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_pages (
  slug VARCHAR(64) NOT NULL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  intro TEXT NOT NULL,
  body MEDIUMTEXT NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_counters (
  name VARCHAR(64) NOT NULL PRIMARY KEY,
  next_value BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  source VARCHAR(32) NOT NULL,
  source_path VARCHAR(512) NOT NULL,
  dest_relative VARCHAR(512) NOT NULL,
  public_url VARCHAR(1024) NOT NULL,
  bytes BIGINT NOT NULL DEFAULT 0,
  checksum_sha256 CHAR(64) NULL,
  verified TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  error TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY media_source_path (source, source_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO order_counters (name, next_value) VALUES ('product_id', 100), ('order_number', 1001);

INSERT IGNORE INTO store_settings (
  id, store_name, announcement, support_email, support_phone, seasonal_collection,
  legal_pages, offer, seasonal_banner, seo
) VALUES (
  1, 'Budy Bear', 'Free Delivery on Orders Above Rs. 3,000', 'support@budybear.com',
  '+92 333 0370236', 'winter', '{}', '{}', '{}', '{}'
);

SET FOREIGN_KEY_CHECKS = 1;
