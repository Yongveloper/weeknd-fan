import type { DrawCommand } from './buildTicketLayout';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

export async function renderCommands(
  canvas: HTMLCanvasElement,
  commands: DrawCommand[],
): Promise<Blob> {
  await document.fonts?.ready;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error('이미지를 그릴 수 없습니다. 다시 시도해 주세요.');

  for (const command of commands) {
    if (command.kind === 'fill') {
      context.fillStyle = command.color;
      context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else if (command.kind === 'line') {
      context.beginPath();
      context.strokeStyle = command.color;
      context.lineWidth = command.width;
      context.moveTo(...command.from);
      context.lineTo(...command.to);
      context.stroke();
    } else {
      context.font = command.font;
      context.fillStyle = command.color;
      context.textAlign = command.align ?? 'left';
      context.fillText(command.value, command.x, command.y);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(
              new Error('이미지 생성에 실패했습니다. 다시 시도해 주세요.'),
            ),
      'image/jpeg',
      0.92,
    );
  });
}
