import request, { RequestDocument } from 'graphql-request';
import { config } from '../../../../config';

export function requestApi(query: RequestDocument, variablesAndRequestHeaders?: any): Promise<any> {
  if (variablesAndRequestHeaders) {
    return request(config.ENDPOINT_URL, query, variablesAndRequestHeaders);
  }
  return request(config.ENDPOINT_URL, query);
}
