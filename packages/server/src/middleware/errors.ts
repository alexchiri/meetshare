import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[error]', err.message);

  if (err.message?.includes('File too large')) {
    res.status(413).json({ error: 'File too large' });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
