import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { resolvers } from "./graphql/resolvers";
import { typeDefs } from "./graphql/schema";
import { connectToDatabase } from "./lib/mongodb";

type GraphQLContext = {
  currentUserEmail: string | null;
};

async function bootstrap(): Promise<void> {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
  });

  const port = Number(process.env.PORT ?? 4000);

  const { url } = await startStandaloneServer(server, {
    listen: { port },
    context: async () => {
      await connectToDatabase();
      return { currentUserEmail: null };
    },
  });

  console.log(`GraphQL server ready at ${url}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start GraphQL server", error);
  process.exit(1);
});
