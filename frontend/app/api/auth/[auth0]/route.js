// app/api/auth/[auth0]/route.js

import { handleAuth } from "@/lib/auth0";

export const GET = handleAuth();