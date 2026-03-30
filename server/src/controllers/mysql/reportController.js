const reportService = require("../../services/mysql/reportService");
const { success, fail } = require("../../utils/apiResponse");

function parseQuarterlyParams(query) {
  const year = Number.parseInt(query.year, 10);
  const quarter = Number.parseInt(query.quarter, 10);

  if (!Number.isInteger(year) || year < 1) {
    return {
      isValid: false,
      message: "Query param 'year' must be a positive integer"
    };
  }

  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
    return {
      isValid: false,
      message: "Query param 'quarter' must be an integer from 1 to 4"
    };
  }

  return {
    isValid: true,
    year,
    quarter
  };
}

async function getQuarterlyTop3RoomsReport(req, res, next) {
  try {
    const params = parseQuarterlyParams(req.query);
    if (!params.isValid) {
      return fail(res, params.message, 400);
    }

    const report = await reportService.getQuarterlyTop3RoomsReport(params.year, params.quarter);
    return success(res, report, "Get quarterly top 3 rooms report successfully");
  } catch (error) {
    return next(error);
  }
}

async function getQuarterlyRefundRatioReport(req, res, next) {
  try {
    const params = parseQuarterlyParams(req.query);
    if (!params.isValid) {
      return fail(res, params.message, 400);
    }

    const report = await reportService.getQuarterlyRefundRatioReport(params.year, params.quarter);
    return success(res, report, "Get quarterly refund ratio report successfully");
  } catch (error) {
    return next(error);
  }
}

async function getQuarterlyAdrRevparReport(req, res, next) {
  try {
    const params = parseQuarterlyParams(req.query);
    if (!params.isValid) {
      return fail(res, params.message, 400);
    }

    const report = await reportService.getQuarterlyAdrRevparReport(params.year, params.quarter);
    return success(res, report, "Get quarterly ADR and RevPAR report successfully");
  } catch (error) {
    return next(error);
  }
}

async function getFinancialLedgers(req, res, next) {
  try {
    const { page = 1, pageSize = 10, startDate, endDate, eventType } = req.query;
    
    // Validate pagination params
    const pageNum = Number.parseInt(page, 10);
    const pageSizeNum = Number.parseInt(pageSize, 10);
    
    if (!Number.isInteger(pageNum) || pageNum < 1) {
      return fail(res, "Query param 'page' must be a positive integer", 400);
    }
    
    if (!Number.isInteger(pageSizeNum) || pageSizeNum < 1) {
      return fail(res, "Query param 'pageSize' must be a positive integer", 400);
    }
    
    if (pageSizeNum > 100) {
      return fail(res, "Query param 'pageSize' cannot exceed 100", 400);
    }
    
    // Build filters
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (eventType) filters.eventType = eventType;
    
    const result = await reportService.getFinancialLedgers(pageNum, pageSizeNum, filters);
    return success(res, result, "Get financial ledgers successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getQuarterlyTop3RoomsReport,
  getQuarterlyRefundRatioReport,
  getQuarterlyAdrRevparReport,
  getFinancialLedgers
};