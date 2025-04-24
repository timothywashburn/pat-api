export interface TokenData {
    token: string;
    refreshToken: string;
}

export interface TokenPayload {
    authId: string;
    userId: string;
}

export interface RefreshTokenPayload extends TokenPayload {
    tokenId: string;
}