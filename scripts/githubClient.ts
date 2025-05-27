import dotenv from "dotenv";
import { Octokit } from "octokit";

dotenv.config();

export const octokit = new Octokit({
  auth: `${process.env.GITHUB_TOKEN}`,
});
