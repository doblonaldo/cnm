import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Fallback if the env variables are not set properly
    if (!clientId) {
        return NextResponse.redirect(new URL("/login?error=SSO_NOT_CONFIGURED", process.env.NEXT_PUBLIC_APP_URL || "https://cnm.brphonia.com.br"));
    }

    // Google's OAuth 2.0 endpoint for requesting an access token
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    const options = {
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || "https://cnm.brphonia.com.br"}/api/auth/google/callback`,
        client_id: clientId,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    const qs = new URLSearchParams(options);

    return NextResponse.redirect(`${rootUrl}?${qs.toString()}`);
}
