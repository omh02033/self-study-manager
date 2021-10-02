import mysql from "mysql2";
import "./env";
import { Knex, knex } from "knex";

const knexConfig: Knex.Config = {
  client: "mysql",
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
  },
};

export default knex(knexConfig);