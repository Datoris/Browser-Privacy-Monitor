// converts the source fields into report fields
// to create a valid request body for the POST request to /report
function sourceFieldToReportField ({ field: { aggregate, dataType, id, format, formula, name, sort }, chartColumn }, position) {
  return {
    aggregate,
    chartColumn,
    dataType,
    fieldId: id,
    format,
    formula,
    name,
    position,
    sort
  }
}

export {
  sourceFieldToReportField,
}