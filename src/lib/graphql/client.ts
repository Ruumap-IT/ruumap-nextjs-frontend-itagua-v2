import { GraphQLClient } from "graphql-request";
import { ENV } from "@/constants/env";

export const graphqlClient = new GraphQLClient(ENV.GRAPHQL_ENDPOINT, {
  headers: {
    Authorization: `Bearer ${ENV.STRAPI_TOKEN}`,
    "Content-Type": "application/json",
  },
});



