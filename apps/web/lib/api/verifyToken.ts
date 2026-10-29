import { NextApiRequest } from "next";
import { JWT } from "next-auth/jwt";
import getTokenFromRequest from "./getTokenFromRequest";
import isTokenRevoked from "./isTokenRevoked";

type Props = {
  req: NextApiRequest;
};

export default async function verifyToken({
  req,
}: Props): Promise<JWT | string> {
  const token = await getTokenFromRequest(req);
  const userId = token?.id;

  if (!userId) {
    return "You must be logged in.";
  }

  if (token.exp < Date.now() / 1000) {
    return "Your session has expired, please log in again.";
  }

  if (await isTokenRevoked(token)) {
    return "Your session has expired, please log in again.";
  }

  return token;
}
