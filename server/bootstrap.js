"use strict";
const { getFullPopulateObject } = require("./helpers");

module.exports = ({ strapi }) => {
  // Subscribe to the lifecycles that we are intrested in.

  strapi.db.lifecycles.subscribe((event) => {
    if (event.action === "beforeFindMany" || event.action === "beforeFindOne") {
      const populate = event.params?.populate;
      const defaultDepth =
        strapi.plugin("strapi-plugin-populate-deep")?.config("defaultDepth") ||
        5;
      if (populate && populate[0] === "deep") {
        const relations =
          populate &&
          (populate[2] === "true"
            ? true
            : populate[2] === "false"
            ? false
            : true);

        const depth = populate[1] ?? defaultDepth;

        const removePages = populate[3] === "true" ? "api::page.page" : "";

        const modelObject = getFullPopulateObject(event.model.uid, depth, {
          relations: relations,
          removePages: removePages,
        });
        event.params.populate = modelObject.populate;
      }
    }
  });
};
