export type Phase = 'waiting' | 'lobby' | 'playing' | 'finished';
export type RoundPhase = 'guessing' | 'revealed';

export interface Room {
  code: string;
  phase: Phase;
  host_id: string;
  current_round: number;
  total_rounds: number;
  packs: string[];
  created_at: string;
}

export interface Player {
  id: string;
  room_code: string;
  name: string;
  score: number;
  lobby_done: boolean;
  connected: boolean;
  joined_at: string;
}

export interface LobbyCard {
  id: string;
  player_id: string;
  room_code: string;
  card_order: number;
  question_index: number;
  target_position: number; // only returned to card owner & on reveal
  person_name: string | null;
  submitted_at: string | null;
}

export interface Round {
  id: string;
  room_code: string;
  round_number: number;
  lobby_card_id: string;
  owner_id: string;
  phase: RoundPhase;
  revealed_at: string | null;
  // joined from lobby_cards
  question_index?: number;
  person_name?: string | null;
  target_position?: number; // only on reveal
}

export interface Guess {
  id: string;
  round_id: string;
  player_id: string;
  room_code: string;
  position: number;
  score: number;
  locked_at: string;
}

export interface GameState {
  room: Room;
  players: Player[];
  myPlayer: Player | null;
  myLobbyCards: LobbyCard[];
  currentRound: Round | null;
  myGuess: Guess | null;
  allGuesses: Guess[];
}
