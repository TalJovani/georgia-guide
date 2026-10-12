function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set. Did you create server/.env?`);
    }
    return value;
}

export const config = {
    jwtSecret: requireEnv("JWT_SECRET"),
    isProduction: process.env.NODE_ENV === "production",
};
