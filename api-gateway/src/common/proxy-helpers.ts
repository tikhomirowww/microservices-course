import { ClientRequest, IncomingMessage } from "http";

export const attachUserHeaders = (proxyReq: ClientRequest, req: IncomingMessage) => {
  const userId = req['user']?.sub;
  const userEmail = req['user']?.email;
  if (userId) proxyReq.setHeader('X-User-Id', userId);
  if (userEmail) proxyReq.setHeader('X-User-Email', userEmail);
};
