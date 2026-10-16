import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

/**
 * Next.js 16 App Router uchun rasmiy Better Auth route handler
 * auth obyekti to'g'ridan-to'g'ri toNextJsHandler ga uzatiladi.
 */
export const { GET, POST } = toNextJsHandler(auth);
