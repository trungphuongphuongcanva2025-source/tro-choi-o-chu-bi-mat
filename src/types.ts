/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: string;
  row_word: string;
}

export interface RowCalculation {
  word: string;
  matchIndex: number;
  startColumn: number;
  endColumn: number;
}
