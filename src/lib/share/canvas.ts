import { CARD_WIDTH, CARD_HEIGHT, type DrawCommand } from './cardDesign';

export { CARD_WIDTH, CARD_HEIGHT } from './cardDesign';

const images = new Map<string, Promise<HTMLImageElement>>();
const generations = new WeakMap<HTMLCanvasElement, number>();

function loadImage(src: string): Promise<HTMLImageElement> {
  let pending = images.get(src);
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => {
        images.delete(src);
        reject(
          new Error('배경 이미지를 불러오지 못했습니다. 다시 시도해 주세요.'),
        );
      };
      image.src = src;
    });
    images.set(src, pending);
  }
  return pending;
}

export async function renderCommands(
  canvas: HTMLCanvasElement,
  commands: DrawCommand[],
): Promise<Blob> {
  const generation = (generations.get(canvas) ?? 0) + 1;
  generations.set(canvas, generation);
  canvas.dataset.renderState = 'loading';
  // Canvas-only text may use glyphs that the page itself has never loaded.
  const fontText = new Map<string, string>();
  const loadedImages = new Map<string, HTMLImageElement>();
  for (const command of commands) {
    if (command.kind === 'text') {
      fontText.set(
        command.font,
        (fontText.get(command.font) ?? '') + command.value,
      );
    }
  }
  await Promise.all([
    ...commands
      .filter((command) => command.kind === 'image')
      .map(async (command) => {
        loadedImages.set(command.src, await loadImage(command.src));
      }),
    ...[...fontText].map(([font, text]) => document.fonts?.load(font, text)),
  ]);
  if (generations.get(canvas) !== generation) {
    throw new DOMException('A newer preview is ready.', 'AbortError');
  }
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context)
    throw new Error('이미지를 그릴 수 없습니다. 다시 시도해 주세요.');

  for (const command of commands) {
    context.save();
    if (command.kind === 'fill') {
      context.fillStyle = command.color;
      context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else if (command.kind === 'arc') {
      context.beginPath();
      context.arc(
        ...command.center,
        command.radius,
        command.start,
        command.end,
      );
      context.strokeStyle = command.color;
      context.lineWidth = command.width;
      context.lineCap = 'round';
      context.stroke();
    } else if (command.kind === 'eclipse') {
      const [offsetX, offsetY] = command.occlusionOffset;
      const direction = Math.atan2(offsetY, offsetX);
      const intersection = Math.acos(
        Math.hypot(offsetX, offsetY) / (2 * command.radius),
      );
      // Trace only the exposed solar face so no clipping seam forms a full ring.
      context.beginPath();
      context.arc(
        ...command.center,
        command.radius,
        direction + intersection,
        direction + Math.PI * 2 - intersection,
      );
      context.arc(
        command.center[0] + offsetX,
        command.center[1] + offsetY,
        command.radius,
        direction + Math.PI + intersection,
        direction + Math.PI - intersection,
        true,
      );
      context.closePath();
      context.fillStyle = command.color;
      context.fill();
    } else if (command.kind === 'image') {
      const image = loadedImages.get(command.src)!;
      context.globalAlpha = command.opacity;
      context.globalCompositeOperation = command.blend ?? 'source-over';
      context.drawImage(
        image,
        command.x,
        command.y,
        command.width,
        command.height,
      );
    } else if (command.kind === 'wash') {
      const gradient = context.createLinearGradient(
        ...command.from,
        ...command.to,
      );
      command.stops.forEach(([offset, color]) =>
        gradient.addColorStop(offset, color),
      );
      context.fillStyle = gradient;
      context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    } else if (command.kind === 'line') {
      context.beginPath();
      context.strokeStyle = command.color;
      context.lineWidth = command.width;
      context.setLineDash(command.dash ?? []);
      context.moveTo(...command.from);
      context.lineTo(...command.to);
      context.stroke();
    } else {
      context.font = command.font;
      context.fillStyle = command.color;
      context.textAlign = command.align ?? 'left';
      if (command.maxWidth) {
        const width = context.measureText(command.value).width;
        if (width > command.maxWidth) {
          // Reduce font size instead of horizontally squeezing long song titles.
          context.font = command.font.replace(
            /([\d.]+)px/,
            (_, size: string) =>
              `${(Number(size) * command.maxWidth!) / width}px`,
          );
        }
      }
      if (command.glow) {
        context.shadowColor = command.glow.color;
        context.shadowBlur = command.glow.blur;
      }
      if (command.roundColon) {
        const [before = '', after = ''] = command.value.split(':');
        const beforeWidth = context.measureText(before).width;
        const colonWidth = context.measureText(':').width;
        const totalWidth =
          beforeWidth + colonWidth + context.measureText(after).width;
        const start =
          command.x -
          (command.align === 'right'
            ? totalWidth
            : command.align === 'center'
              ? totalWidth / 2
              : 0);
        const cap = context.measureText('H');
        const radius =
          parseFloat(context.font.match(/([\d.]+)px/)?.[1] ?? '0') * 0.055;
        const center = start + beforeWidth + colonWidth / 2;
        context.textAlign = 'left';
        context.fillText(before, start, command.y);
        context.fillText(after, start + beforeWidth + colonWidth, command.y);
        // Use the same round, cap-height colon as the DOM wordmark. Drawing
        // it after fonts load keeps preview and downloaded JPEG identical.
        for (const y of [
          command.y - cap.actualBoundingBoxAscent + radius,
          command.y + cap.actualBoundingBoxDescent - radius,
        ]) {
          context.beginPath();
          context.arc(center, y, radius, 0, Math.PI * 2);
          context.fill();
        }
      } else if (command.outline) {
        context.strokeStyle = command.color;
        context.lineWidth = command.outline;
        context.strokeText(command.value, command.x, command.y);
      } else {
        context.fillText(command.value, command.x, command.y);
      }
    }
    context.restore();
  }

  canvas.dataset.renderState = 'ready';

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
