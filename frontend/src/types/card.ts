/**
 * Scryfall Card Image URIs
 */
export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  art_crop?: string;
  border_crop?: string;
}

/**
 * Scryfall Card Data
 */
export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors?: string[];
  color_identity?: string[];
  set: string;
  set_name: string;
  rarity: string;
  image_uris?: ScryfallImageUris;
  prices?: {
    usd?: string | null;
    usd_foil?: string | null;
    eur?: string | null;
    eur_foil?: string | null;
  };
  legalities?: {
    [format: string]: 'legal' | 'not_legal' | 'restricted' | 'banned';
  };
}

/**
 * Card Model
 */
export interface Card {
  id: string;
  collection_id: string;
  scryfall_id: string;
  owner_name: string;
  current_deck: string | null;
  is_borrowed: boolean;
  is_foil: boolean;
  quantity: number;
  set_code: string | null;
  set_name: string | null;
  price_usd: number;
  added_at: string;
}

/**
 * Card with Scryfall Details
 */
export interface CardWithDetails extends Card {
  scryfall_data: ScryfallCard | null;
}

/**
 * Add Card Request
 */
export interface AddCardRequest {
  scryfall_id: string;
  owner_name: string;
  current_deck?: string;
  is_borrowed?: boolean;
  quantity?: number;
  set_code?: string;
  set_name?: string;
}

/**
 * Update Card Request
 */
export interface UpdateCardRequest {
  owner_name?: string;
  current_deck?: string;
  is_borrowed?: boolean;
  is_foil?: boolean;
  quantity?: number;
  set_code?: string;
  set_name?: string;
}

/**
 * Scryfall Search Response
 */
export interface ScryfallSearchResponse {
  object: 'list';
  total_cards: number;
  has_more: boolean;
  data: ScryfallCard[];
}

/**
 * Scryfall Autocomplete Response
 */
export interface ScryfallAutocompleteResponse {
  object: 'catalog';
  total_values?: number;
  data: string[];
}
