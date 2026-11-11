import Joi from "joi";

export const templateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  elements: Joi.array().items(Joi.object()).required(),

  canvasSize: Joi.object({
    width: Joi.number().required(),
    height: Joi.number().required(),
  }).required(),

  counters: Joi.object({
    text: Joi.number().integer().min(0).default(0),
    image: Joi.number().integer().min(0).default(0),
    shape: Joi.number().integer().min(0).default(0),
    qr: Joi.number().integer().min(0).default(0),
    barcode: Joi.number().integer().min(0).default(0),
    star: Joi.number().integer().min(0).default(0),
  }).default({}),

  publicId: Joi.string().optional(),
  thumbnailUrl: Joi.string().uri().optional(),
});
