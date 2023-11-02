import { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

type Props = {
  req: NextApiRequest;
};

export default async function authenticateUser({ req }: Props) {
  const token = await getToken({ req });

  if (!token?.id) {
    return { response: "You must be logged in.", status: 401 };
  } else if (token.isSubscriber === false)
    return {
      response:
        "You are not a subscriber, feel free to reach out to us at support@linkwarden.app in case of any issues.",
      status: 401,
    };

  return token;
}
