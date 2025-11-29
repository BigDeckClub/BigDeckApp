# Shared Locations

This document explains how location sharing works in BigDeckApp, enabling collaborative cube building and shared inventory management.

## Overview

The location sharing feature allows users to grant other users access to their locations (cubes, binders, boxes, etc.). This enables collaborative workflows such as:

- **Collaborative Cube Building**: Multiple users can maintain a cube together
- **Shared Draft Pools**: Share card pools for draft events
- **Trading Binders**: Let trading partners view your available cards
- **Group Collections**: Manage a shared collection among friends

## Permission Levels

When sharing a location, you specify one of three permission levels:

| Level | Description |
|-------|-------------|
| **VIEW** | User can see cards in the location but cannot modify anything |
| **EDIT** | User can add/remove cards from the location |
| **ADMIN** | User can share the location with other users (same access as owner) |

### Permission Hierarchy

```
OWNER (implicit - location.user_id)
  └── ADMIN (can share with others)
        └── EDIT (can modify cards)
              └── VIEW (read-only access)
```

**Note:** The location owner always has implicit ADMIN access and cannot be removed from their own location.

## Database Schema

The `location_shares` table stores all sharing relationships:

```sql
CREATE TABLE location_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission_level VARCHAR(20) NOT NULL DEFAULT 'VIEW',
  shared_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shared_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(location_id, shared_with_user_id)
);
```

### Key Constraints

- **UNIQUE(location_id, shared_with_user_id)**: Prevents duplicate shares - a user can only have one permission level per location
- **ON DELETE CASCADE**: When a location or user is deleted, associated shares are automatically removed

## Use Cases

### 1. Collaborative Cube Building

Perfect for groups who maintain a cube together:

1. User A creates a location named "Vintage Cube"
2. User A shares it with Users B and C with EDIT permissions
3. All three users can add/remove cards from the cube
4. Cards remain in the original owner's inventory
5. Any changes are tracked in the transaction history

```sql
-- User A shares cube with User B (EDIT access)
INSERT INTO location_shares (location_id, shared_with_user_id, permission_level, shared_by_user_id)
VALUES 
  ('cube-location-uuid', 'user-b-uuid', 'EDIT', 'user-a-uuid');

-- User A shares cube with User C (EDIT access)  
INSERT INTO location_shares (location_id, shared_with_user_id, permission_level, shared_by_user_id)
VALUES 
  ('cube-location-uuid', 'user-c-uuid', 'EDIT', 'user-a-uuid');
```

### 2. Shared Draft Pools

For organizing draft events:

1. Create a location for the draft event card pool
2. Share with all participants as VIEW
3. Everyone can see what's available for drafting
4. After the draft, unshare or delete the location

```sql
-- Share draft pool with all participants (VIEW only)
INSERT INTO location_shares (location_id, shared_with_user_id, permission_level, shared_by_user_id)
VALUES 
  ('draft-pool-uuid', 'participant-1-uuid', 'VIEW', 'organizer-uuid'),
  ('draft-pool-uuid', 'participant-2-uuid', 'VIEW', 'organizer-uuid'),
  ('draft-pool-uuid', 'participant-3-uuid', 'VIEW', 'organizer-uuid');
```

### 3. Trading Binders

Share your available cards with trading partners:

1. User has a "Trade Binder" location with cards available for trade
2. Share with trading partners as VIEW
3. They can browse what's available
4. Upgrade to EDIT if doing direct swaps

```sql
-- Share trade binder with a trading partner
INSERT INTO location_shares (location_id, shared_with_user_id, permission_level, shared_by_user_id)
VALUES ('trade-binder-uuid', 'trading-partner-uuid', 'VIEW', 'owner-uuid');

-- Later, upgrade to EDIT for direct swaps
UPDATE location_shares 
SET permission_level = 'EDIT'
WHERE location_id = 'trade-binder-uuid' 
  AND shared_with_user_id = 'trading-partner-uuid';
```

## Example Workflows

### Creating a Shared Cube

```sql
-- Step 1: Create the cube location
INSERT INTO locations (user_id, name, description, location_type)
VALUES ('owner-uuid', 'Vintage Cube', 'Our playgroup vintage cube', 'cube')
RETURNING id;  -- Returns: 'new-cube-uuid'

-- Step 2: Share with collaborators
INSERT INTO location_shares (location_id, shared_with_user_id, permission_level, shared_by_user_id)
VALUES 
  ('new-cube-uuid', 'collaborator-1-uuid', 'EDIT', 'owner-uuid'),
  ('new-cube-uuid', 'collaborator-2-uuid', 'EDIT', 'owner-uuid');
```

### Checking Who Has Access

```sql
-- Get all users with access to a location (including owner)
SELECT 
  CASE WHEN l.user_id = u.id THEN 'OWNER' ELSE ls.permission_level END as access_level,
  u.username,
  COALESCE(ls.shared_at, l.created_at) as access_since,
  COALESCE(sharer.username, 'N/A') as shared_by
FROM locations l
JOIN users owner ON l.user_id = owner.id
LEFT JOIN location_shares ls ON l.id = ls.location_id
LEFT JOIN users u ON (u.id = ls.shared_with_user_id OR u.id = l.user_id)
LEFT JOIN users sharer ON ls.shared_by_user_id = sharer.id
WHERE l.id = 'location-uuid'
  AND u.id IS NOT NULL;
```

### Checking a User's Permission

```sql
-- Check if a specific user has access and what level
SELECT 
  CASE 
    WHEN l.user_id = 'user-to-check-uuid' THEN 'OWNER'
    ELSE COALESCE(ls.permission_level, 'NONE')
  END as access_level
FROM locations l
LEFT JOIN location_shares ls ON l.id = ls.location_id 
  AND ls.shared_with_user_id = 'user-to-check-uuid'
WHERE l.id = 'location-uuid';
```

### Revoking Access

```sql
-- Remove a user's access to a location
DELETE FROM location_shares 
WHERE location_id = 'location-uuid' 
  AND shared_with_user_id = 'user-to-remove-uuid';
```

### Getting All Shared Locations for a User

```sql
-- Get all locations shared with a specific user
SELECT 
  l.id,
  l.name,
  l.description,
  l.location_type,
  ls.permission_level,
  ls.shared_at,
  owner.username as owner_username,
  sharer.username as shared_by_username
FROM locations l
JOIN location_shares ls ON l.id = ls.location_id
JOIN users owner ON l.user_id = owner.id
JOIN users sharer ON ls.shared_by_user_id = sharer.id
WHERE ls.shared_with_user_id = 'user-uuid'
ORDER BY ls.shared_at DESC;
```

## Data Integrity

### Automatic Cleanup

- When a **location is deleted**, all shares for that location are automatically removed (CASCADE delete)
- When a **user is deleted**, all shares where they are the recipient OR the sharer are automatically removed
- The **UNIQUE constraint** prevents accidentally creating duplicate shares

### Permission Validation

Permission levels should be validated at the application level. Valid values are:
- `VIEW`
- `EDIT`
- `ADMIN`

### Owner Access

The location owner (identified by `locations.user_id`) always has implicit ADMIN access. Application code should check ownership before checking shares:

```sql
-- Complete access check function
SELECT 
  CASE 
    WHEN l.user_id = 'checking-user-uuid' THEN 'OWNER'
    WHEN ls.permission_level IS NOT NULL THEN ls.permission_level
    ELSE 'NONE'
  END as access_level
FROM locations l
LEFT JOIN location_shares ls ON l.id = ls.location_id 
  AND ls.shared_with_user_id = 'checking-user-uuid'
WHERE l.id = 'location-uuid';
```

## Best Practices

1. **Start with VIEW**: When sharing for the first time, start with VIEW access and upgrade as needed
2. **Use ADMIN sparingly**: Only grant ADMIN to users who should be able to invite others
3. **Clean up shares**: Remove shares when they're no longer needed (e.g., after a draft event)
4. **Check before sharing**: Verify the recipient user exists before creating a share

## Future Enhancements

The following features may be added in future releases:

- **Audit log**: Track who shared/unshared when for accountability
- **Email notifications**: Notify users when locations are shared with them
- **Expiring shares**: Add an `expiration_date` column for temporary access
- **Public/unlisted locations**: Allow anyone with a link to view certain locations
- **Share links**: Generate unique links for sharing without knowing user IDs
