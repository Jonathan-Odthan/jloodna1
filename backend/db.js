const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL est obligatoire pour démarrer le serveur.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, phone TEXT,
      password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer',
      verified BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS reset_tokens (
      token_hash TEXT PRIMARY KEY, email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, brand TEXT, description TEXT, price NUMERIC NOT NULL,
      price_old NUMERIC, stock INTEGER NOT NULL DEFAULT 0, sku TEXT, category TEXT, status TEXT NOT NULL DEFAULT 'active',
      image TEXT, tags JSONB NOT NULL DEFAULT '[]', dropship BOOLEAN NOT NULL DEFAULT false,
      variants JSONB NOT NULL DEFAULT '[]', rating NUMERIC NOT NULL DEFAULT 0, reviews INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, user_id TEXT, items JSONB NOT NULL, address JSONB NOT NULL, shipping JSONB NOT NULL,
      payment TEXT NOT NULL, currency TEXT NOT NULL, subtotal NUMERIC NOT NULL, ship_cost NUMERIC NOT NULL,
      discount NUMERIC NOT NULL DEFAULT 0, total NUMERIC NOT NULL, status TEXT NOT NULL, payment_status TEXT NOT NULL,
      tracking_code TEXT UNIQUE NOT NULL, notes TEXT, history JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id);
    CREATE INDEX IF NOT EXISTS orders_email_idx ON orders((address->>'email'));
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY, type TEXT NOT NULL, value NUMERIC NOT NULL, min_order NUMERIC NOT NULL DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 100, uses INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT true,
      expires DATE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL,
      global_notice BOOLEAN NOT NULL DEFAULT false, read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY, action TEXT NOT NULL, detail TEXT, user_email TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await query(`
    INSERT INTO products (id,title,brand,description,price,price_old,stock,sku,category,status,image,tags,dropship,variants,rating,reviews,created_at)
    SELECT id,title,brand,description,price,priceOld,stock,sku,category,status,image,tags::jsonb,dropship,variants::jsonb,rating,reviews,COALESCE(createdAt::timestamptz, now())
    FROM jsonb_to_recordset($1::jsonb) AS p(id text,title text,brand text,description text,price numeric,priceOld numeric,stock integer,sku text,category text,status text,image text,tags text,dropship boolean,variants text,rating numeric,reviews integer,createdAt text)
    ON CONFLICT (id) DO NOTHING
  `, [JSON.stringify(require('./models/productSeed'))]);
  await query(`
    INSERT INTO coupons (code,type,value,min_order,max_uses,uses,active,expires) VALUES
    ('JLOODNA10','percent',10,0,100,45,true,'2026-12-31'),
    ('BIENVENUE20','percent',20,5000,50,12,true,'2026-12-31'),
    ('HAITI50','percent',50,20000,30,8,true,'2026-12-31'),
    ('SHIP500','fixed',500,3000,200,23,true,'2026-12-31')
    ON CONFLICT (code) DO NOTHING
  `);
}

module.exports = { pool, query, initDatabase };
