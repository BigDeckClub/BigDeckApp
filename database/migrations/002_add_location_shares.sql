-- Migration: 002_add_location_shares
-- Description: Enables multiple users to share access to locations for collaborative cubes
-- Created: 2025-11-29

-- =====================================================
-- LOCATION_SHARES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS location_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission_level VARCHAR(20) NOT NULL DEFAULT 'VIEW',
  shared_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(location_id, shared_with_user_id)
);

CREATE INDEX IF NOT EXISTS idx_location_shares_location ON location_shares(location_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_user ON location_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_location_shares_shared_by ON location_shares(shared_by_user_id);

COMMENT ON TABLE location_shares IS 'Enables sharing locations between users for collaborative cubes and shared inventory management';
COMMENT ON COLUMN location_shares.permission_level IS 'Permission levels: VIEW (read-only), EDIT (add/remove cards), ADMIN (can share with others)';

-- Record this migration
INSERT INTO schema_migrations (migration_name) VALUES ('002_add_location_shares')
ON CONFLICT (migration_name) DO NOTHING;
