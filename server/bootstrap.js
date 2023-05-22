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
        const relations = populate && populate[2] === "true" ? true : false;
        const depth = populate[1] ?? defaultDepth;

        let excludes = [];
        if (populate[3]) {
          for (let index = 3; index < populate.length; index++) {
            excludes.push(populate[index]);
          }
        }

        const modelObject = getFullPopulateObject(event.model.uid, depth, {
          relations: relations,
          excludes: excludes,
        });
        event.params.populate = modelObject.populate;
      }
    }
  });
};
