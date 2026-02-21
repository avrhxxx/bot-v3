import dotenv from "dotenv";
dotenv.config();

export const config = {
  token: process.env.BOT_TOKEN as string,
};