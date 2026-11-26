-- Canonical admin access migration. Apply once through Prisma migration.
CREATE TABLE admin_access_grants (
  uid varchar(255) PRIMARY KEY REFERENCES users(uid) ON DELETE RESTRICT,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by_uid varchar(255) NOT NULL
);
CREATE TABLE admin_access_events (
  id bigserial PRIMARY KEY,
  target_uid varchar(255) NOT NULL,
  actor_uid varchar(255) NOT NULL,
  action varchar(10) NOT NULL CHECK (action IN ('grant', 'revoke')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'beerpassport_admin_viewer') THEN
    GRANT SELECT ON admin_access_grants, admin_access_events TO beerpassport_admin_viewer;
  END IF;
END $$;
