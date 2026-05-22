import { GraphQLElements } from '../elements/GraphQLElements';

export class SchemaBuilder {
  private graphQLElementsList: GraphQLElements[];

  constructor(graphQLElementsList: GraphQLElements[]) {
    this.graphQLElementsList = graphQLElementsList;
  }

  build() {
    return {
      typeDefs: this.graphQLElementsList.map((element) => element.typeDefs),
      resolvers: this.graphQLElementsList.map((element) => element.resolvers),
    };
  }
}
