-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Collections table (extensible for multiple TCGs)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  tcg_type VARCHAR(50) NOT NULL, -- 'mtg', 'pokemon', etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cards table (MTG-specific for now, but structured for extension)
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  scryfall_id VARCHAR(255) NOT NULL, -- Reference to Scryfall API
  owner_name VARCHAR(255), -- Physical owner text field
  current_deck VARCHAR(255), -- Which deck it's in
  is_borrowed BOOLEAN DEFAULT FALSE,
  added_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cards_collection ON cards(collection_id);
CREATE INDEX idx_collections_user ON collections(user_id);