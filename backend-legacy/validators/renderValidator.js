import Joi from "joi";

export const renderSchema = Joi.object({
  templateId: Joi.string().required(),
  format: Joi.string().valid("png", "jpeg", "webp").default("png"),
  width: Joi.number().integer().min(100).max(5000).optional(),
  height: Joi.number().integer().min(100).max(5000).optional(),
  modifications: Joi.object().pattern(
    Joi.string(), // element name or id
    Joi.object({
      content: Joi.string().optional(),
      color: Joi.string().optional(),
      src: Joi.string().uri().optional(),
      fontSize: Joi.number().optional(),
      family: Joi.string().optional(),
      fill: Joi.string().optional(),
      stroke: Joi.string().optional(),
      textAlignIndex: Joi.number().valid(0, 1, 2).optional(),
      rotation: Joi.number().optional(),
      x: Joi.number().optional(),
      y: Joi.number().optional(),
      width: Joi.number().optional(),
      height: Joi.number().optional(),
      borderWidth: Joi.number().optional(),
      borderColor: Joi.string().optional(),
      borderRadius: Joi.object({
        value: Joi.number().required(),
        unit: Joi.string().valid("px", "%").required(),
      }).optional(),
      objectFit: Joi.string().valid("fill", "cover", "contain").optional(),
      value: Joi.string().optional(), // for qr-code/barcode
      format: Joi.string().optional(), // barcode format
      strokeColor: Joi.string().optional(),
      strokeWidth: Joi.number().optional(),
      rating: Joi.number().optional(),
    })
  ).default({}),
});
