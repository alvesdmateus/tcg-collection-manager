import { Request } from 'express';

/**
 * Custom Error class for operational errors
 */
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Supported TCG types
 */
export enum TcgType {
  MAGIC = 'magic',
  POKEMON = 'pokemon',
  YUGIOH = 'yugioh'
}

/**
 * JWT Token Payload
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Auth Token Payload (alias for JwtPayload)
 */
export interface AuthTokenPayload extends JwtPayload {}

/**
 * Authenticated Request - extends Express Request with user info
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * User Model
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

/**
 * Collection Model
 */
export interface Collection {
  id: string;
  user_id: string;
  name: string;
  tcg_type: TcgType;
  created_at: Date;
}

/**
 * Collection with card count
 */
export interface CollectionStats extends Collection {
  card_count: number;
}

/**
 * Create Collection Request DTO
 */
export interface CreateCollectionRequest {
  name: string;
  tcg_type: TcgType;
}

/**
 * Update Collection Request DTO
 */
export interface UpdateCollectionRequest {
  name?: string;
  tcg_type?: TcgType;
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
  quantity: number;
  set_code: string | null;
  set_name: string | null;
  added_at: Date;
}

/**
 * Create Card Request DTO
 */
export interface CreateCardRequest {
  scryfall_id: string;
  owner_name: string;
  current_deck?: string;
  is_borrowed?: boolean;
  quantity?: number;
  set_code?: string;
  set_name?: string;
}

/**
 * Update Card Request DTO
 */
export interface UpdateCardRequest {
  owner_name?: string;
  current_deck?: string;
  is_borrowed?: boolean;
  quantity?: number;
  set_code?: string;
  set_name?: string;
}

/**
 * Auth Register Request DTO
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Auth Login Request DTO
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Auth Response DTO
 */
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Add Card Request DTO (alias for CreateCardRequest)
 */
export interface AddCardRequest extends CreateCardRequest {}

/**
 * User Response DTO (without password hash)
 */
export interface UserResponseDto {
  id: string;
  email: string;
  created_at: Date;
}

/**
 * User Create DTO
 */
export interface UserCreateDto {
  email: string;
  password: string;
}

/**
 * User Login DTO
 */
export interface UserLoginDto {
  email: string;
  password: string;
}

/**
 * Collection Statistics
 */
export interface CollectionStats {
  total_cards: number;
  unique_cards: number;
  borrowed_cards: number;
}

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
 * Simplified version - Scryfall has many more fields
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

/**
 * Card with Scryfall Details
 */
export interface CardWithDetails extends Card {
  scryfall_data: ScryfallCard | null;
}
