import { wordmark } from '../../components/chrome/navigation';

export type DrawCommand =
  | { kind: 'fill'; color: string }
  | {
      kind: 'arc';
      center: [number, number];
      radius: number;
      start: number;
      end: number;
      color: string;
      width: number;
    }
  | {
      kind: 'eclipse';
      center: [number, number];
      radius: number;
      occlusionOffset: [number, number];
      color: string;
    }
  | {
      kind: 'image';
      src: string;
      x: number;
      y: number;
      width: number;
      height: number;
      opacity: number;
      blend?: GlobalCompositeOperation;
    }
  | {
      kind: 'wash';
      from: [number, number];
      to: [number, number];
      stops: [number, string][];
    }
  | {
      kind: 'line';
      from: [number, number];
      to: [number, number];
      color: string;
      width: number;
      dash?: number[];
    }
  | {
      kind: 'text';
      value: string;
      x: number;
      y: number;
      font: string;
      color: string;
      align?: CanvasTextAlign;
      maxWidth?: number;
      outline?: number;
      roundColon?: boolean;
      glow?: { color: string; blur: number };
    };

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
export const cardInk = {
  night: '#080807',
  ivory: '#f1e9dc',
  gold: '#e6a359',
  light: '#f1dcc6',
  muted: '#bdad98',
  rule: '#735139',
};
export const displayFont = (size: number) =>
  `400 ${size}px "Bebas Neue", sans-serif`;
export const bodyFont = (size: number, weight = 500) =>
  `${weight} ${size}px "Noto Sans KR Variable", sans-serif`;

export function cardRule(y: number, dashed = false): DrawCommand {
  return {
    kind: 'line',
    from: [74, y],
    to: [1006, y],
    color: cardInk.rule,
    width: 1,
    ...(dashed ? { dash: [5, 9] } : {}),
  };
}

/** The same cover, palette and margins make both exports one edition. */
export function cardCover(): DrawCommand[] {
  return [
    { kind: 'fill', color: cardInk.night },
    {
      kind: 'eclipse',
      center: [862, 300],
      radius: 114,
      occlusionOffset: [-14, 0],
      color: cardInk.gold,
    },
    {
      kind: 'text',
      value: wordmark.name,
      roundColon: true,
      x: 74,
      y: 79,
      font: displayFont(34),
      color: cardInk.gold,
    },
    {
      kind: 'text',
      value: 'GOYANG / 2026',
      x: 1006,
      y: 76,
      font: bodyFont(22),
      color: cardInk.muted,
      align: 'right',
    },
    cardRule(103),
    {
      kind: 'text',
      value: 'THE WEEKND',
      x: 74,
      y: 174,
      font: displayFont(60),
      color: cardInk.ivory,
    },
    {
      kind: 'text',
      value: 'AFTER HOURS',
      x: 74,
      y: 310,
      font: displayFont(124),
      color: cardInk.ivory,
      maxWidth: 600,
    },
    {
      kind: 'text',
      value: 'TIL DAWN',
      x: 74,
      // Preserve the 10.36px visible gap between the two tour lines. Their
      // equal cap heights leave about 46px above and below the title block.
      y: 409.4,
      font: displayFont(124),
      color: cardInk.light,
      outline: 2,
    },
    cardRule(456),
  ];
}

export function cardFooter(): DrawCommand[] {
  return [
    {
      kind: 'text',
      value: wordmark.name,
      roundColon: true,
      x: 74,
      y: 1285,
      font: displayFont(32),
      color: cardInk.gold,
    },
    {
      kind: 'text',
      value: 'UNOFFICIAL FAN GUIDE',
      x: 1006,
      y: 1282,
      font: bodyFont(20),
      color: cardInk.muted,
      align: 'right',
    },
  ];
}
