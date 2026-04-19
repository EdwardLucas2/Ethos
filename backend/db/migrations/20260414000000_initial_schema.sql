-- migrate:up

-- Users
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supertokens_user_id TEXT        NOT NULL UNIQUE,
    display_name        TEXT        NOT NULL,
    tag                 TEXT        NOT NULL UNIQUE,
    email               TEXT        NOT NULL UNIQUE,
    avatar_id           UUID,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tag ON users (tag);

-- Device tokens (Expo push, one user → many devices)
CREATE TABLE device_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token        TEXT        NOT NULL UNIQUE,
    platform     TEXT        NOT NULL CHECK (platform IN ('ios', 'android')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_tokens_user_id ON device_tokens (user_id);

-- One-way contacts list
CREATE TABLE contacts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        NOT NULL REFERENCES users (id),
    contact_user_id  UUID        NOT NULL REFERENCES users (id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, contact_user_id),
    CHECK (user_id != contact_user_id)
);

CREATE INDEX idx_contacts_user_id ON contacts (user_id);

-- Contracts (top-level accountability agreement)
CREATE TABLE contracts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID        NOT NULL REFERENCES users (id),
    name       TEXT        NOT NULL,
    forfeit    TEXT        NOT NULL,
    period     TEXT        NOT NULL CHECK (period IN ('weekly', 'biweekly', 'monthly')),
    start_date DATE        NOT NULL,
    status     TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Participants (user membership and commitment within a contract)
CREATE TABLE participants (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id              UUID        NOT NULL REFERENCES contracts (id),
    user_id                  UUID        NOT NULL REFERENCES users (id),
    habit                    TEXT,
    frequency                INTEGER CHECK (frequency > 0),
    sign_status              TEXT        NOT NULL DEFAULT 'waiting' CHECK (sign_status IN ('waiting', 'drafting', 'signed', 'declined', 'removed')),
    opted_out_of_next_cycle  BOOLEAN     NOT NULL DEFAULT false,
    invited_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    signed_at                TIMESTAMPTZ,
    UNIQUE (contract_id, user_id)
);

CREATE INDEX idx_participants_contract_id ON participants (contract_id);
CREATE INDEX idx_participants_user_id ON participants (user_id);

-- Cycles (a single time-bound period within a contract)
CREATE TABLE cycles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id  UUID    NOT NULL REFERENCES contracts (id),
    cycle_number INTEGER NOT NULL,
    start_date      DATE    NOT NULL,
    end_date        DATE    NOT NULL,
    voting_deadline DATE    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_resolution', 'settled')),
    UNIQUE (contract_id, cycle_number),
    CHECK (end_date > start_date),
    CHECK (voting_deadline > end_date)
);

-- Habit actions (one slot per participant per frequency unit per cycle)
CREATE TABLE habit_actions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id       UUID        NOT NULL REFERENCES cycles (id),
    participant_id UUID        NOT NULL REFERENCES participants (id),
    action_number  INTEGER     NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (cycle_id, participant_id, action_number)
);

CREATE INDEX idx_habit_actions_cycle_participant ON habit_actions (cycle_id, participant_id);

-- Evidence (proof submitted against a habit action)
CREATE TABLE evidence (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_action_id UUID        NOT NULL REFERENCES habit_actions (id),
    photo_id        UUID,
    note            TEXT,
    status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'auto_approved')),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (photo_id IS NOT NULL OR note IS NOT NULL)
);

CREATE INDEX idx_evidence_habit_action_id ON evidence (habit_action_id);

-- Votes (approve/reject on a piece of evidence)
CREATE TABLE votes (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id          UUID        NOT NULL REFERENCES evidence (id),
    voter_participant_id UUID        NOT NULL REFERENCES participants (id),
    decision             TEXT        NOT NULL CHECK (decision IN ('approve', 'reject')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (evidence_id, voter_participant_id)
);

CREATE INDEX idx_votes_evidence_id ON votes (evidence_id);

-- Cycle resolutions (outcome of a settled cycle)
CREATE TABLE cycle_resolutions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id   UUID        NOT NULL UNIQUE REFERENCES cycles (id),
    winner_ids UUID[]      NOT NULL DEFAULT '{}',
    loser_ids  UUID[]      NOT NULL DEFAULT '{}',
    forfeit    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GIN indexes required for ANY() membership queries on UUID arrays
CREATE INDEX idx_cycle_resolutions_winner_ids ON cycle_resolutions USING GIN (winner_ids);
CREATE INDEX idx_cycle_resolutions_loser_ids  ON cycle_resolutions USING GIN (loser_ids);

-- Resolution acknowledgments (per-participant ack and settlement state)
CREATE TABLE resolution_acknowledgments (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resolution_id UUID        NOT NULL REFERENCES cycle_resolutions (id),
    user_id       UUID        NOT NULL REFERENCES users (id),
    acknowledged_at TIMESTAMPTZ,
    settled_at    TIMESTAMPTZ,
    UNIQUE (resolution_id, user_id)
);

CREATE INDEX idx_resolution_acknowledgments_resolution_id ON resolution_acknowledgments (resolution_id);

-- Pesters (winner pestering a loser to pay up)
CREATE TABLE pesters (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resolution_id UUID        NOT NULL REFERENCES cycle_resolutions (id),
    from_user_id  UUID        NOT NULL REFERENCES users (id),
    to_user_id    UUID        NOT NULL REFERENCES users (id),
    sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pesters_resolution_from_to ON pesters (resolution_id, from_user_id, to_user_id);

-- Notifications (persistent per-user alert records)
CREATE TABLE notifications (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id  UUID        NOT NULL REFERENCES users (id),
    type               TEXT        NOT NULL CHECK (type IN ('evidence_uploaded', 'contract_invited', 'cycle_pending_resolution', 'resolution_loser', 'resolution_winner', 'pester')),
    entity_id          UUID,
    entity_type        TEXT CHECK (entity_type IN ('evidence', 'contract', 'cycle', 'cycle_resolution', 'pester')),
    read_at            TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_user_id, read_at);

-- migrate:down

DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS pesters;
DROP TABLE IF EXISTS resolution_acknowledgments;
DROP TABLE IF EXISTS cycle_resolutions;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS habit_actions;
DROP TABLE IF EXISTS cycles;
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS device_tokens;
DROP TABLE IF EXISTS users;
