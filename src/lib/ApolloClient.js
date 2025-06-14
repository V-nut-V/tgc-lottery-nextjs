// lib/ApolloClient.js
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://monkfish-app-xxwk8.ondigitalocean.app/graphql", // <-- Replace with real URL
    fetchOptions: {
      // Optional fetch settings
    },
  }),
  cache: new InMemoryCache(),
});

export default client;
