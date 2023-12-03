import type { NextApiRequest, NextApiResponse } from 'next';
import * as process from "process";

export type ResponseData = {
    credentialsEnabled: string|undefined
    emailEnabled: string|undefined
    registrationDisabled: string|undefined
    buttonAuths: {
        method: string
        name: string
    }[]
}
export default function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    res.json(getLogins());
}

export function getLogins() {
    const buttonAuths = []
    if (process.env.NEXT_PUBLIC_KEYCLOAK_ENABLED === 'true') {
        buttonAuths.push({method: 'keycloak', name: 'Keycloak'});
    }
    if (process.env.NEXT_PUBLIC_AUTHENTIK_ENABLED === 'true') {
        buttonAuths.push({method: 'authentik', name: process.env.AUTHENTIK_CUSTOM_NAME ?? 'Authentik'});
    }
    return {
        credentialsEnabled: (process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED === 'true' || process.env.NEXT_PUBLIC_CREDENTIALS_ENABLED === undefined) ? "true" : "false",
        emailEnabled: process.env.NEXT_PUBLIC_EMAIL_PROVIDER,
        registrationDisabled: process.env.NEXT_PUBLIC_DISABLE_REGISTRATION,
        buttonAuths: buttonAuths
    };
}