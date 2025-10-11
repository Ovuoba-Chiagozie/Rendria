import Template from "../models/Template.js";

/**
 * Get automation config for a template
 * Returns column headers and setup data for Google Sheets
 */
export const getAutomationConfig = async (req, res) => {
  try {
    const { id } = req.params;

    // Find template - restrict by user
    const template = await Template.findOne({ _id: id, userId: req.userId });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    // Generate column headers based on template elements
    const columnHeaders = generateColumnHeaders(template.elements);

    // Build response
    const config = {
      templateId: template._id.toString(),
      templateName: template.name,
      columnHeaders: columnHeaders,
      sheetTemplateUrl: process.env.GOOGLE_SHEET_TEMPLATE_URL || "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/copy",
      apiUrl: `${process.env.API_BASE_URL || "https://api.rendria.com"}/v1/render`
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error("Error in getAutomationConfig:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get automation config",
      error: error.message
    });
  }
};

/**
 * Helper function to generate column headers from template elements
 */
function generateColumnHeaders(elements) {
  const headers = ["template_id"]; // Always first column
  const addedLayers = new Set();

  // Sort elements by type for consistent ordering
  const sortedElements = [...elements].sort((a, b) => {
    const typeOrder = { text: 1, image: 2, qr: 3, barcode: 4, "star-rating": 5, shape: 6 };
    return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
  });

  sortedElements.forEach((element) => {
    const layerName = element.name;

    if (addedLayers.has(layerName)) return;
    addedLayers.add(layerName);

    switch (element.type) {
      case "text":
        headers.push(`${layerName}_content`);
        headers.push(`${layerName}_fontSize`);
        headers.push(`${layerName}_color`);
        break;

      case "image":
        headers.push(`${layerName}_src`);
        break;

      case "qr":
        headers.push(`${layerName}_value`);
        break;

      case "barcode":
        headers.push(`${layerName}_value`);
        break;

      case "star-rating":
        headers.push(`${layerName}_rating`);
        break;

      case "shape":
        headers.push(`${layerName}_fill`);
        break;

      default:
        headers.push(`${layerName}_content`);
    }
  });

  // Add system columns at the end - NEW "ready" column added
  headers.push("format", "ready", "status", "image_url", "notes");

  return headers;
}