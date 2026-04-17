import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import { Bet, GamePlugin, GameResult } from '../../../domain/models/game.model';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
interface Card { rank: Rank; suit: Suit; }

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck(): Card[] {
  return SUITS.flatMap(suit => RANKS.map(rank => ({ rank, suit })));
}

function shuffle(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function score(hand: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const { rank } of hand) {
    if (rank === 'A') { total += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(rank)) total += 10;
    else total += parseInt(rank, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function label(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && score(hand) === 21;
}

@Injectable()
export class BlackjackPlugin implements GamePlugin {
  getName(): string {
    return 'blackjack';
  }

  async execute(bet: Bet): Promise<GameResult> {
    const action: 'hit' | 'stand' = bet.selection?.action === 'stand' ? 'stand' : 'hit';

    const deck = shuffle(buildDeck());
    let idx = 0;
    const draw = () => deck[idx++];

    const playerHand: Card[] = [draw(), draw()];
    const dealerHand: Card[] = [draw(), draw()];

    if (action === 'hit') playerHand.push(draw());

    const playerScore = score(playerHand);

    // Jugador se pasa
    if (playerScore > 21) {
      return {
        winner: false,
        payout: 0,
        winningSelection: {
          playerHand: playerHand.map(label),
          dealerHand: dealerHand.map(label),
          playerScore,
          dealerScore: score(dealerHand),
          action,
        },
        message: `Te pasaste con ${playerScore}. Perdiste.`,
      };
    }

    // Dealer juega: pide hasta >= 17
    while (score(dealerHand) < 17) dealerHand.push(draw());

    const dealerScore = score(dealerHand);
    const pBJ = isBlackjack(playerHand);
    const dBJ = isBlackjack(dealerHand);

    let winner: boolean;
    let payout: number;
    let message: string;

    if (pBJ && dBJ) {
      // Empate: ambos blackjack — devuelve la apuesta
      winner = true;
      payout = bet.amount;
      message = 'Empate: ambos tienen Blackjack. Recuperas tu apuesta.';
    } else if (pBJ) {
      winner = true;
      payout = Math.floor(bet.amount * 2.5);
      message = `¡BLACKJACK! Paga 3:2. Ganaste ${payout} fichas.`;
    } else if (dBJ) {
      winner = false;
      payout = 0;
      message = 'El Dealer tiene Blackjack. Perdiste.';
    } else if (dealerScore > 21) {
      winner = true;
      payout = bet.amount * 2;
      message = `El Dealer se pasó con ${dealerScore}. ¡Ganaste ${payout} fichas!`;
    } else if (playerScore > dealerScore) {
      winner = true;
      payout = bet.amount * 2;
      message = `Ganaste ${playerScore} vs ${dealerScore}. ¡Ganaste ${payout} fichas!`;
    } else if (playerScore === dealerScore) {
      // Empate normal — devuelve la apuesta
      winner = true;
      payout = bet.amount;
      message = `Empate ${playerScore} vs ${dealerScore}. Recuperas tu apuesta.`;
    } else {
      winner = false;
      payout = 0;
      message = `Perdiste ${playerScore} vs ${dealerScore}.`;
    }

    return {
      winner,
      payout,
      winningSelection: {
        playerHand: playerHand.map(label),
        dealerHand: dealerHand.map(label),
        playerScore,
        dealerScore,
        action,
      },
      message,
    };
  }
}
