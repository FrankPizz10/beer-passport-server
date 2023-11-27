import * as mysql from 'mysql2/promise';

const URL = process.env.DATABASE_URL;
const DBSERVER = process.env.ENVIRONMENT === 'PROD' ? 'localhost' : 'mysql-db';
console.log(`DatabaseUrl in healthcheck: ${URL}`);

const dbConfig = {
  host: DBSERVER, // Replace with your MySQL host
  user: 'root', // Replace with your MySQL username
  password: 'beerpassport210', // Replace with your MySQL password
  port: 3306, // MySQL port
  database: 'beersdb', // Name of the database to check
};

let numTries = 1;

async function healthCheck() {
  try {
    // Create a MySQL connection
    const connection = await mysql.createConnection(dbConfig);

    // Attempt to ping the database
    await connection.ping();

    console.log(`Health check ${numTries}: beersdb exists and is accessible.`);
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
