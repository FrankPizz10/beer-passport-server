import * as mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DBSERVER = process.env.ENVIRONMENT === 'PROD' ? 'localhost' : 'mysql-db';

const dbConfig = {
  host: DBSERVER, // Replace with your MySQL host
  user: 'root', // Replace with your MySQL username
  password: process.env.MYSQL_ROOT_PASSWORD, // Replace with your MySQL password
  port: 3306, // MySQL port
  database: process.env.MYSQL_DATABASE, // Name of the database to check
};

let numTries = 1;

async function healthCheck() {
  try {
    // Create a MySQL connection
    const connection = await mysql.createConnection(dbConfig);

    // Attempt to ping the database
    await connection.ping();

    console.log(
      `Health check ${numTries}: ${process.env.MYSQL_DATABASE} exists and is accessible.`,
    );
    connection.end();
    process.exit(0);
  } catch (error) {
    console.error(`Health check ${numTries} failed:`, error);
    return false;
  }
}

const healthCheckRunner = async () => {
  while (numTries < 15) {
    if (await healthCheck()) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
    numTries++;
  }
};

healthCheckRunner();
