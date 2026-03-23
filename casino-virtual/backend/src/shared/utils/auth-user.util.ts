import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

type AuthPayload = {
  sub?: string;
  userId?: string;
  wlId?: string;
};

export function getAuthenticatedUserId(request: Request): string {
  const payload = (request as Request & { user?: AuthPayload }).user;
  const userId = payload?.wlId ?? payload?.userId ?? payload?.sub;

  if (!userId) {
    throw new UnauthorizedException('No se pudo resolver wlId desde el token');
  }

  return userId;
}

export function getBearerTokenFromRequest(request: Request): string {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedException('Token no proporcionado');
  }

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    throw new UnauthorizedException('Formato de token inválido');
  }

  return token;
}