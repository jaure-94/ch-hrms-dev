import { db, pool } from "../server/db";
import {
  companies,
  companySettings,
  contractTemplates,
  contracts,
  departments,
  employees,
  employments,
  jobRoles,
  refreshTokens,
  roles,
  users,
} from "../shared/schema";

async function resetDatabase() {
  const tablesInDeleteOrder = [
    contracts,
    contractTemplates,
    employments,
    jobRoles,
    employees,
    refreshTokens,
    users,
    companySettings,
    departments,
    companies,
    roles,
  ];

  for (const table of tablesInDeleteOrder) {
    await db.delete(table);
  }
}

resetDatabase()
  .then(() => {
    console.log("Database cleared successfully");
  })
  .catch((error) => {
    console.error("Failed to reset database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

