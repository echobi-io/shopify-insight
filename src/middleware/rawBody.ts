import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage } from 'http';

export interface NextApiRequestWithRawBody extends NextApiRequest {
  rawBody: Buffer;
}

export function getRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

export function withRawBody(handler: (req: NextApiRequestWithRawBody, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get raw body for webhook verification
      const rawBody = await getRawBody(req);
      
      // Attach raw body to request
      (req as NextApiRequestWithRawBody).rawBody = rawBody;
      
      // Parse JSON body if content-type is application/json
      const contentType = req.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        try {
          req.body = JSON.parse(rawBody.toString('utf8'));
        } catch (error) {
          console.error('Failed to parse JSON body:', error);
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }
      
      // Call the original handler
      await handler(req as NextApiRequestWithRawBody, res);
    } catch (error) {
      console.error('Raw body middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}