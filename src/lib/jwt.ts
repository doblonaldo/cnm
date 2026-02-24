import { SignJWT, jwtVerify } from "jose";

type Payload = {
    jti: string;
    iat: number;
    userId: string;
    email: string;
    groupId: string;
};

export const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length === 0) {
        throw new Error("A variável de ambiente JWT_SECRET não está definida.");
    }
    return secret;
};

export async function signToken(payload: Partial<Payload>) {
    const secret = new TextEncoder().encode(getJwtSecretKey());
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("8h")
        .sign(secret);
}

export async function verifyToken(token: string) {
    try {
        const secret = new TextEncoder().encode(getJwtSecretKey());
        const { payload } = await jwtVerify(token, secret);
        return payload as Payload;
    } catch (error) {
        return null;
    }
}
