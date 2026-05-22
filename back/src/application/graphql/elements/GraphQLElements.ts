import { DocumentNode } from 'graphql/language';
import { GraphQLScalarType } from 'graphql';

type ResolverType = { Query: any; Time?: GraphQLScalarType };

export class GraphQLElements {
  private readonly _typeDefs: DocumentNode;
  private readonly _resolvers: ResolverType;

  constructor(typeDefs: DocumentNode, resolvers: ResolverType) {
    this._typeDefs = typeDefs;
    this._resolvers = resolvers;
  }

  get typeDefs(): DocumentNode {
    return this._typeDefs;
  }

  get resolvers(): ResolverType {
    return this._resolvers;
  }
}
