import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";

/**
 * AssetAudit — Better Auth brauzer (Client Components) mijozi
 * LMS uslubidagi Login + Parol va Email avtorizatsiyasini qo'llab-quvvatlaydi.
 */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

export const { signIn, signOut, useSession, getSession } = authClient;
