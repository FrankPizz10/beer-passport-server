-- Canonical catalog change and reversible archive migration.
BEGIN;
ALTER TABLE beers ADD COLUMN archived_at timestamptz;
ALTER TABLE breweries ADD COLUMN archived_at timestamptz;
ALTER TABLE categories ADD COLUMN archived_at timestamptz;
ALTER TABLE styles ADD COLUMN archived_at timestamptz;

CREATE TABLE catalog_change_requests (
  id serial PRIMARY KEY,
  entity_type varchar(20) NOT NULL CHECK (entity_type IN ('beers', 'breweries', 'categories', 'styles')),
  entity_id integer NOT NULL,
  action varchar(20) NOT NULL CHECK (action IN ('edit', 'archive', 'restore')),
  status varchar(20) NOT NULL CHECK (status IN ('pending', 'applied', 'rejected', 'reverted')),
  before_data jsonb NOT NULL,
  proposed_data jsonb NOT NULL,
  before_hash varchar(64) NOT NULL,
  after_hash varchar(64),
  requested_by_uid varchar(255) NOT NULL,
  reviewed_by_uid varchar(255),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE INDEX catalog_change_requests_status_id_idx ON catalog_change_requests(status, id);
CREATE INDEX catalog_change_requests_entity_idx ON catalog_change_requests(entity_type, entity_id, id);
CREATE TABLE catalog_change_events (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES catalog_change_requests(id) ON DELETE RESTRICT,
  actor_uid varchar(255) NOT NULL,
  action varchar(20) NOT NULL CHECK (action IN ('requested', 'applied', 'rejected', 'reverted')),
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX catalog_change_events_request_id_idx ON catalog_change_events(request_id, id);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'beerpassport_admin_viewer') THEN
    GRANT SELECT ON catalog_change_requests, catalog_change_events TO beerpassport_admin_viewer;
  END IF;
END $$;
COMMIT;
