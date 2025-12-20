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
}

/**
 * Update Card Request DTO
 */
export interface UpdateCardRequest {
  owner_name?: string;
  current_deck?: string;
  is_borrowed?: boolean;
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
