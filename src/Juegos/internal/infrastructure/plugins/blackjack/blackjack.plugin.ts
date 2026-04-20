import { Injectable, BadRequestException } from '@nestjs/common';
import { randomInt, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { Bet, GamePlugin, GameResult } from '../../../domain/models/game.model';

type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
interface Card { v: Rank; s: Suit; }

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildShoe(numDecks = 6): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    for (const s of SUITS) {
      for (const v of RANKS) {
        shoe.push({ v, s });
      }
    }
  }
  return shoe;
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
  for (const { v } of hand) {
    if (v === 'A') { total += 11; aces++; }
    else if (['J', 'Q', 'K'].includes(v)) total += 10;
    else total += parseInt(v, 10);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function isBJ(hand: Card[]): boolean {
  return hand.length === 2 && score(hand) === 21;
}

// AES-256-CBC Encryption for Stateless State Machine (Poka-Yoke)
const SECRET_KEY = Buffer.from(process.env.SESSION_SECRET || '12345678901234567890123456789012');

function encryptState(state: any): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(state), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decryptState(token: string): any {
  try {
    const parts = token.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = createDecipheriv('aes-256-cbc', SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    throw new BadRequestException('Token de juego inválido o alterado.');
  }
}

interface GameState {
  shoe: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  initialBet: number;
}

@Injectable()
export class BlackjackPlugin implements GamePlugin {
  getName(): string {
    return 'blackjack';
  }

  async execute(bet: Bet): Promise<GameResult> {
    const action = bet.selection?.action || 'deal'; // 'deal' | 'hit' | 'stand' | 'double'

    if (action === 'deal') {
      if (bet.amount <= 0) {
        throw new BadRequestException('La apuesta debe ser mayor a 0 para repartir.');
      }

      const shoe = shuffle(buildShoe());
      // Draw first 4 cards
      const playerHand: Card[] = [shoe.pop()!, shoe.pop()!];
      const dealerHand: Card[] = [shoe.pop()!, shoe.pop()!];

      const state: GameState = { shoe, playerHand, dealerHand, initialBet: bet.amount };
      
      const pBJ = isBJ(playerHand);
      const dBJ = isBJ(dealerHand);

      // Si hay un Blackjack inicial, la partida termina atómicamente de inmediato.
      if (pBJ || dBJ) {
        return this.evaluateFinalState(state, true);
      }

      // Si no, devolvemos el estado para continuar jugando (sin pagar nada todavía)
      return {
        winner: false, // aún no se evalúa
        payout: 0,
        message: 'Tu turno. ¿Pides o te plantas?',
        winningSelection: {
          token: encryptState(state),
          playerHand,
          dealerHand: [dealerHand[0]], // Ocultamos la segunda carta del dealer (hole card)
          pScore: score(playerHand),
          isOver: false,
          initialBet: bet.amount
        }
      };
    } 
    
    // Acciones interactivas en progreso
    if (!bet.selection?.token) {
      throw new BadRequestException('Se requiere un token de estado para continuar la partida.');
    }

    const state: GameState = decryptState(bet.selection.token);

    if (action === 'hit') {
      state.playerHand.push(state.shoe.pop()!);
      const pScore = score(state.playerHand);

      if (pScore > 21) {
        return this.evaluateFinalState(state, false); // Se pasó. Termina.
      } else {
        return {
          winner: false,
          payout: 0,
          message: 'Pediste carta...',
          winningSelection: {
            token: encryptState(state),
            playerHand: state.playerHand,
            dealerHand: [state.dealerHand[0]],
            pScore,
            isOver: false,
            initialBet: state.initialBet
          }
        };
      }
    }

    if (action === 'stand') {
      return this.evaluateFinalState(state, false);
    }

    if (action === 'double') {
      if (state.playerHand.length !== 2) {
        throw new BadRequestException('Solo puedes Doblar en tu mano inicial.');
      }
      if (bet.amount !== state.initialBet) {
        throw new BadRequestException('El monto al Doblar debe ser igual a la apuesta original.');
      }
      
      state.initialBet *= 2; // Doblamos la apuesta oficial del token
      state.playerHand.push(state.shoe.pop()!); // Da 1 sola carta obligatoria

      // Pase o no pase, se planta automáticamente según reglas de Doblar.
      return this.evaluateFinalState(state, false);
    }

    throw new BadRequestException('Acción no reconocida.');
  }

  /**
   * Resuelve la jugada final, hace robar al Dealer si es necesario, 
   * y calcula los premios a otorgar.
   */
  private evaluateFinalState(state: GameState, isInitialDeal: boolean): GameResult {
    const pScore = score(state.playerHand);
    
    // Si el jugador ya se pasó, el dealer ni se molesta en destapar o pedir
    if (pScore > 21) {
      return {
        winner: false,
        payout: 0,
        message: '¡Puntos pasados! Pierdes la apuesta.',
        winningSelection: {
          playerHand: state.playerHand,
          dealerHand: state.dealerHand,
          pScore,
          dScore: score(state.dealerHand),
          isOver: true,
          initialBet: Math.floor(state.initialBet / 2) // Opcional: mostrar la apuesta real final
        }
      };
    }

    // Dealer destapa su carta y compra hasta 17
    while (score(state.dealerHand) < 17) {
      state.dealerHand.push(state.shoe.pop()!);
    }

    const dScore = score(state.dealerHand);
    const pBJ = isInitialDeal && isBJ(state.playerHand);
    const dBJ = isInitialDeal && isBJ(state.dealerHand);

    let winner = false;
    let payout = 0;
    let message = '';

    if (pBJ && !dBJ) {
      winner = true;
      payout = Math.floor(state.initialBet * 2.5); // 3:2
      message = '¡BLACKJACK!';
    } else if (dBJ && !pBJ) {
      winner = false;
      message = 'El Dealer tiene Blackjack.';
    } else if (pBJ && dBJ) {
      winner = true;
      payout = state.initialBet; // Push
      message = 'Empate de Blackjack.';
    } else if (dScore > 21 || pScore > dScore) {
      winner = true;
      payout = state.initialBet * 2; // 1:1
      message = '¡Ganaste!';
    } else if (pScore === dScore) {
      winner = true;
      payout = state.initialBet; // Push
      message = 'Empate.';
    } else {
      winner = false;
      message = 'El Dealer gana.';
    }

    return {
      winner,
      payout,
      message,
      winningSelection: {
        playerHand: state.playerHand,
        dealerHand: state.dealerHand,
        pScore,
        dScore,
        isOver: true,
        initialBet: state.initialBet
      }
    };
  }
}
