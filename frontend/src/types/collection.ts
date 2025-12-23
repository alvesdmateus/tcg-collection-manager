export enum TcgType {
  MAGIC = 'magic',
  POKEMON = 'pokemon',
  YUGIOH = 'yugioh'
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  tcg_type: TcgType;
  created_at: string;
  card_count?: number;
  total_value?: number;
}

export interface CreateCollectionRequest {
  name: string;
  tcg_type: TcgType;
}

export interface UpdateCollectionRequest {
  name?: string;
  tcg_type?: TcgType;
}
