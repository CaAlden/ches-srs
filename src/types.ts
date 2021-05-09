/**
 * Type definitions for code data.
 */

import { MoveTree } from './controller';
import { OrderedMap as ImmutableMap } from 'immutable';

export type Color = 'w' | 'b';

type Id = string;
type Ref<T extends IPersisted> = T['id'];

interface IPersisted {
  id: Id;
}

interface IOpeningBase extends IPersisted {
  name: string;
  moveTree: ImmutableMap<string, MoveTree>;
  // Comments linked to the position on the board
  comments: ImmutableMap<string, string>;
  color: Color;
}

export interface IOpening extends IOpeningBase {
  items: Ref<IItem>[];
}

export interface IItem extends IPersisted {
  /**
   * Ease Factor for calculating the next interval.
   */
  EF: number;
  /**
   * Time for next review in days
   */
  interval: number;
  /**
   * Information to include with the position.
   */
  comment: string;
  /**
   * The date of the next time to review this item.
   * Null when the item is unlearned.
   */
  nextReview: Date | null;
  /**
   * A PGN representing the moves played leading to this position.
   */
  pgn: string;
  /**
   * The FEN of the position that is reached after playing the correct move.
   * This could be used for detecting transpositions.
   */
  finalPosition: string;

  /**
   * The next move to play.
   */
  nextMove: string;
}
