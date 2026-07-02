import { pool } from "./db";

let ensureCompatibilityPromise: Promise<void> | null = null;

export async function ensureCityOfDayCompatibility() {
    if (!ensureCompatibilityPromise) {
        ensureCompatibilityPromise = (async () => {
            await pool.query(`
        ALTER TABLE users
          ADD COLUMN IF NOT EXISTS first_name varchar,
          ADD COLUMN IF NOT EXISTS last_name varchar,
          ADD COLUMN IF NOT EXISTS profile_image_url varchar,
          ADD COLUMN IF NOT EXISTS discovered_cities integer DEFAULT 0,
          ADD COLUMN IF NOT EXISTS bucket_list_cities integer DEFAULT 0,
          ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
          ADD COLUMN IF NOT EXISTS last_visit_date timestamptz,
          ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()
      `);

            await pool.query(`
        ALTER TABLE cities
          ADD COLUMN IF NOT EXISTS scheduled_date timestamptz,
          ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false,
          ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false,
          ADD COLUMN IF NOT EXISTS city_cta_links jsonb,
          ADD COLUMN IF NOT EXISTS morning_cta_link varchar,
          ADD COLUMN IF NOT EXISTS afternoon_cta_link varchar,
          ADD COLUMN IF NOT EXISTS evening_cta_link varchar,
          ADD COLUMN IF NOT EXISTS bonus_cta_link varchar,
          ADD COLUMN IF NOT EXISTS luxury_cta_link varchar,
          ADD COLUMN IF NOT EXISTS wildlife_cta_link varchar,
          ADD COLUMN IF NOT EXISTS morning_share_template varchar DEFAULT 'Wake up in {CITY}! 🌄',
          ADD COLUMN IF NOT EXISTS afternoon_share_template varchar DEFAULT 'Spend the afternoon in {CITY}! 🏙️',
          ADD COLUMN IF NOT EXISTS evening_share_template varchar DEFAULT 'Evening vibes in {CITY}! 🌆',
          ADD COLUMN IF NOT EXISTS bonus_share_template varchar DEFAULT 'Hidden gem in {CITY}! 💎',
          ADD COLUMN IF NOT EXISTS luxury_share_template varchar DEFAULT 'Luxury awaits in {CITY}! ✨',
          ADD COLUMN IF NOT EXISTS wildlife_share_template varchar DEFAULT 'Wild side of {CITY}! 🦎',
          ADD COLUMN IF NOT EXISTS image_url varchar,
          ADD COLUMN IF NOT EXISTS sample_itinerary text,
          ADD COLUMN IF NOT EXISTS highlights jsonb,
          ADD COLUMN IF NOT EXISTS audio_timestamps jsonb,
          ADD COLUMN IF NOT EXISTS audio_text text
      `);

            await pool.query(`
        UPDATE cities
        SET is_published = CASE WHEN status = 'published' THEN true ELSE false END
        WHERE is_published IS DISTINCT FROM CASE WHEN status = 'published' THEN true ELSE false END
      `);

            await pool.query(`
        ALTER TABLE city_content
          ADD COLUMN IF NOT EXISTS card_type varchar,
          ADD COLUMN IF NOT EXISTS content text,
          ADD COLUMN IF NOT EXISTS affiliate_links jsonb
      `);

            await pool.query(`
        UPDATE city_content
        SET
          card_type = COALESCE(card_type, type),
          content = COALESCE(content, description)
        WHERE card_type IS NULL OR content IS NULL
      `);

            await pool.query(`
        CREATE TABLE IF NOT EXISTS color_themes (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          name varchar NOT NULL,
          description varchar,
          hero_gradient_start varchar NOT NULL,
          hero_gradient_end varchar NOT NULL,
          accent_bar_background varchar NOT NULL,
          accent_bar_text varchar NOT NULL,
          card_badge_background varchar NOT NULL,
          card_badge_text varchar NOT NULL,
          header_background varchar NOT NULL,
          header_text varchar NOT NULL,
          is_active boolean DEFAULT false,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        )
      `);

            await pool.query(`
        CREATE TABLE IF NOT EXISTS user_collected_cities (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar REFERENCES users(id) ON DELETE CASCADE,
          city_id varchar REFERENCES cities(id) ON DELETE CASCADE,
          collected_at timestamptz DEFAULT now()
        )
      `);

            await pool.query(`
        CREATE TABLE IF NOT EXISTS user_bucket_list (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar REFERENCES users(id) ON DELETE CASCADE,
          city_id varchar REFERENCES cities(id) ON DELETE CASCADE,
          added_at timestamptz DEFAULT now()
        )
      `);

            await pool.query(`
        CREATE TABLE IF NOT EXISTS user_travel_photos (
          id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id varchar REFERENCES users(id) ON DELETE CASCADE,
          city_id varchar REFERENCES cities(id) ON DELETE SET NULL,
          photo_url varchar NOT NULL,
          city_name varchar NOT NULL,
          state_name varchar,
          caption text,
          file_size integer,
          original_file_name varchar,
          is_public boolean DEFAULT false,
          taken_at timestamptz DEFAULT now(),
          created_at timestamptz DEFAULT now()
        )
      `);
        })().catch((error) => {
            ensureCompatibilityPromise = null;
            throw error;
        });
    }

    return ensureCompatibilityPromise;
}