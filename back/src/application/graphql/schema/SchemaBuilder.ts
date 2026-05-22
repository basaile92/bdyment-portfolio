import { GraphQLElements } from '../elements/GraphQLElements';

type ResolverMap = Record<string, unknown>;

export class SchemaBuilder {
  private graphQLElementsList: GraphQLElements[];

  constructor(graphQLElementsList: GraphQLElements[]) {
    this.graphQLElementsList = graphQLElementsList;
  }

  build() {
    const merged: ResolverMap = {};
    for (const element of this.graphQLElementsList) {
      for (const key of Object.keys(element.resolvers)) {
        const incoming = (element.resolvers as Record<string, unknown>)[key];
        if (incoming && typeof incoming === 'object' && !Array.isArray(incoming)) {
          merged[key] = { ...((merged[key] as object) ?? {}), ...(incoming as object) };
        } else {
          merged[key] = incoming;
        }
      }
    }
    return {
      typeDefs: this.graphQLElementsList.map((element) => element.typeDefs),
      resolvers: merged,
    };
  }
}
