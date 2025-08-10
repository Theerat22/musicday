import mysql from "mysql2/promise";
if (!process.env.MYSQL_URI) {
  throw new Error("MYSQL_URI is not defined in environment variables");
}

export const mysqlPool = mysql.createPool({
  uri: process.env.MYSQL_URI,
});
