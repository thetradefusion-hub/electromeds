import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config/env.js';

export interface TokenPayload {
  id: string;
  email: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    String(config.jwtSecret),
    {
      expiresIn: config.jwtExpire,
    } as SignOptions
  );
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

