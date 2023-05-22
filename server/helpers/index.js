const { isEmpty, merge } = require("lodash/fp");

const getModelPopulationAttributes = (model) => {
  if (model.uid === "plugin::upload.file") {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }

  return model.attributes;
};

const getFullPopulateObject = (
  modelUid,
  maxDepth = 20,
  populateOptions = {}
) => {
  const { relations = true, excludes = [] } = populateOptions;

  const skipCreatorFields = strapi
    .plugin("strapi-plugin-populate-deep")
    ?.config("skipCreatorFields");

  if (maxDepth <= 1) {
    return true;
  }
  if (modelUid === "admin::user" && skipCreatorFields) {
    return undefined;
  }

  const populate = {};
  const model = strapi.getModel(modelUid);

  for (const [key, value] of Object.entries(
    getModelPopulationAttributes(model)
  )) {
    if (value && value.target !== "api::page.page") {
      if (value.type === "component") {
        populate[key] = getFullPopulateObject(
          value.component,
          maxDepth - 1,
          populateOptions
        );
      } else if (value.type === "dynamiczone") {
        const dynamicPopulate = value.components.reduce((prev, cur) => {
          const curPopulate = getFullPopulateObject(
            cur,
            maxDepth - 1,
            populateOptions
          );
          return curPopulate === true ? prev : merge(prev, curPopulate);
        }, {});
        populate[key] = isEmpty(dynamicPopulate) ? true : dynamicPopulate;
      } else if (value.type === "relation") {
        if (
          excludes.includes(key) ||
          value.target !== "api::page.page" ||
          value.target !== "admin::user" ||
          relations
        ) {
          const relationPopulate = getFullPopulateObject(
            value.target,
            key === "localizations" && maxDepth > 2 ? 1 : maxDepth - 1,
            populateOptions
          );
          if (relationPopulate) {
            populate[key] = relationPopulate;
          }
        }
      } else if (value.type === "media") {
        populate[key] = true;
      }
    }
  }
  return isEmpty(populate) ? true : { populate };
};

module.exports = {
  getFullPopulateObject,
};
