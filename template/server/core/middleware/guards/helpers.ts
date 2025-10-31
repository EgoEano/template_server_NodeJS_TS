import type { Request, Response } from 'express';

export function rawBodySaverForExpressJs(
  req: Request & { rawBody?: string },
  res: Response,
  buf: Buffer,
  encoding: BufferEncoding
) {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
}