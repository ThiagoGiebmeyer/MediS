export const jwtConfig = {
  secret: process.env.API_SECRET || "",
  expiresIn: "1h",
};
