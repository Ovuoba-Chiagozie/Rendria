import camelcaseKeys from "camelcase-keys";
import snakecaseKeys from "snakecase-keys";

export const normalizeRequest = (req, res, next) => {
  if (req.body) {
    if (req.body.modifications && typeof req.body.modifications === "object") {
      // Pull out modifications first
      const { modifications, ...rest } = req.body;

      // Camelcase the rest of the body
      const normalized = camelcaseKeys(rest, { deep: true });

      // Keep modifications keys as-is, but camelcase their values
      normalized.modifications = Object.fromEntries(
        Object.entries(modifications).map(([key, val]) => [
          key, // keep original element name
          camelcaseKeys(val, { deep: true }),
        ])
      );

      req.body = normalized;
    } else {
      req.body = camelcaseKeys(req.body, { deep: true });
    }
  }

  if (req.query) {
    Object.assign(req.query, camelcaseKeys(req.query, { deep: true }));
  }

  if (req.params) {
    Object.assign(req.params, camelcaseKeys(req.params, { deep: true }));
  }

  next();
};

export const formatResponse = (req, res, next) => {
  const oldJson = res.json;
  res.json = function (data) {
    return oldJson.call(this, snakecaseKeys(data, { deep: true }));
  };
  next();
};
