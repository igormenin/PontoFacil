/**
 * Utility for exporting data to various formats.
 */

/**
 * Converts an array of objects to a CSV string.
 * @param {Array<Object>} data 
 * @returns {string}
 */
export const convertToCSV = (data) => {
    if (!data || !data.length) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Header row
    csvRows.push(headers.join(';'));
    
    // Data rows
    for (const row of data) {
        const values = headers.map(header => {
            const val = row[header];
            const escaped = ('' + (val ?? '')).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(';'));
    }
    
    return csvRows.join('\n');
};

/**
 * Generates a standard filename based on context.
 */
export const generateFilename = (prefix) => {
    const date = new Date().toISOString().split('T')[0];
    return `pontofacil_${prefix}_${date}`;
};
