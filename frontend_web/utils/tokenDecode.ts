import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userId: string;
  exp: number;
}

export function isTokenExpired(): boolean {
  try {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode<TokenPayload>(token || '');

    if (!decoded.exp) return true;

    const now = Date.now() / 1000;

    return decoded.exp < now;
  } catch {
    return true;
  }
}
