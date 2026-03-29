const { pool } = require("../../config/mysql");
const env = require("../../config/env");

const procedureSchemaCache = new Map();

function toIdentifier(name) {
  return `\`${String(name).replace(/`/g, "``")}\``;
}

async function resolveProcedureSchema(procedureName) {
  if (procedureSchemaCache.has(procedureName)) {
    return procedureSchemaCache.get(procedureName);
  }

  let schema = env.MYSQL_DATABASE;

  try {
    const [rows] = await pool.query(
      `
      SELECT ROUTINE_SCHEMA
      FROM information_schema.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_NAME = ?
      ORDER BY (ROUTINE_SCHEMA = ?) DESC
      LIMIT 1
      `,
      [procedureName, env.MYSQL_DATABASE]
    );

    if (rows[0] && rows[0].ROUTINE_SCHEMA) {
      schema = rows[0].ROUTINE_SCHEMA;
    }
  } catch (error) {
    schema = env.MYSQL_DATABASE;
  }

  procedureSchemaCache.set(procedureName, schema);
  return schema;
}

async function callQuarterlyProcedure(procedureName, year, quarter) {
  const schema = await resolveProcedureSchema(procedureName);
  const qualifiedProcedure = schema
    ? `${toIdentifier(schema)}.${toIdentifier(procedureName)}`
    : toIdentifier(procedureName);

  const [rows] = await pool.query(`CALL ${qualifiedProcedure}(?, ?)`, [year, quarter]);
  return rows[0] || [];
}

async function getQuarterlyTop3RoomsReport(year, quarter) {
  return callQuarterlyProcedure("SP_Generate_QuarterlyTop3Rooms", year, quarter);
}

async function getQuarterlyRefundRatioReport(year, quarter) {
  return callQuarterlyProcedure("SP_Generate_QuarterlyRefundRatio", year, quarter);
}

async function getQuarterlyAdrRevparReport(year, quarter) {
  return callQuarterlyProcedure("SP_Generate_QuarterlyADRRevPAR", year, quarter);
}

module.exports = {
  getQuarterlyTop3RoomsReport,
  getQuarterlyRefundRatioReport,
  getQuarterlyAdrRevparReport
};