/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBClient, QueryCommandOutput } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, BatchWriteCommand, UpdateCommand,
  ScanCommandInput, ScanCommand,
  ScanCommandOutput,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

//
// *** Note: This is a work in progress! ***
//
// Not all of these functions will behave as expected
// However the basics of get/put should be fine
//

// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-example-dynamodb-utilities.html
// https://github.com/awsdocs/aws-doc-sdk-examples/tree/main/javascriptv3/example_code/dynamodb/actions/document-client

/**
 * Recursively converts all Date instances in an object or array to ISO strings.
 * DynamoDB doesn't natively handle Date objects, so they need to be converted to ISO strings.
 */
function convert(obj: any): any {
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(convert);
  }

  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, convert(value)])
    );
  }

  return obj;
}

/**
 * Recursively converts all Date instances in an object or array to ISO strings.
 * DynamoDB doesn't natively handle Date objects, so they need to be converted to ISO strings.
 */
export function convertDates(obj: Record<string, any>): Record<string, any> {
  return convert(obj);
}

export const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(),
  // This should handle keys that are undefined
  { marshallOptions: { removeUndefinedValues: true } },
);

export interface Key {
  index?: string,
  name: string,
  value: unknown,
}

export interface Range {
  index?: string,
  name: string,
  from: unknown,
  to: unknown,
}

export function experssionAttributes(values: { [key: string]: unknown; }) {
  const fields: string[] = [];
  const ExpressionAttributeNames: { [key: string]: string; } = {};
  const ExpressionAttributeValues: { [key: string]: unknown; } = {};
  for (const [key, value] of Object.entries(values)) {
    fields.push(`#${key} = :${key}`);
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = value;
  }
  return { fields, ExpressionAttributeNames, ExpressionAttributeValues };
}
/**
 * Generate the UpdateExpression, ExpressionAttributeNames, and ExpressionAttributeValues parameters for updateItem
 */
function createUpdateExpressions(item: Record<string, any>) {
  const UpdateExpression: string[] = [];
  const ExpressionAttributeValues: Record<string, any> = {};
  const ExpressionAttributeNames: Record<string, any> = {};
  Object.keys(item).forEach((key) => {
    if (item[key]) {
      UpdateExpression.push(`#${key} = :${key}`);
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = item[key];
    }
  });
  return { UpdateExpression: `SET ${UpdateExpression.join(', ')}`, ExpressionAttributeNames, ExpressionAttributeValues };
}

export const DynamoDB = {

  ttlMinutes: (minutes: number) => {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return Math.floor(date.getTime() / 1000.0);
  },

  ttlHours: (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return Math.floor(date.getTime() / 1000.0);
  },

  ttlDays: (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return Math.floor(date.getTime() / 1000.0);
  },

  ttlMonths: (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return Math.floor(date.getTime() / 1000.0);
  },

  ttlYears: (years: number) => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + years);
    return Math.floor(date.getTime() / 1000.0);
  },

  /**
   * Get an item
   * @param tableName DynamoDB table name
   * @param key 1-2 fields: partition key (required) and, optionally, sort key
   * @returns The item, if found, or {}
   */
  getItem: async (tableName: string, key: Record<string, any>): Promise<Record<string, any> | undefined> => {
    const result = await documentClient.send(new GetCommand({
      TableName: tableName,
      Key: key,
    }));
    return result.Item;
  },

  /**
   * Get an item using an index
   * @param tableName DynamoDB table name
   * @param indexName Index name
   * @param id The item ID (partition key)
   * @returns The item, if found, or {} (NB this is a query limited to 1 item)
   */
  getItemIndex: async (tableName: string, indexName: string, partitionKey: Key, sortKey?: Key): Promise<Record<string, any> | undefined> => {
    const items = await DynamoDB.getItems(tableName, indexName, partitionKey, sortKey, 1);
    return items[0];
  },

  /**
   * Get an item using an index
   * @param tableName DynamoDB table name
   * @param indexName Index name
   * @param id The item ID (partition key)
   * @returns The item, if found, or {}
   */
  getIndex: async (tableName: string, indexName: string, indexKey: string, indexValue: any): Promise<Record<string, any> | undefined> => {
    const response = await documentClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: `${indexKey} = :value`,
      ExpressionAttributeValues: {
        ':value': indexValue,
      },
    }));
    return (response.Items || [])[0];
  },

  /**
   * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
   * @param tableName DynamoDB table name
   * @returns All the items that match the partition key and begin with the sort key
   */
  getItems: async (
    tableName: string,
    indexName: string | undefined,
    partitionKey: Key,
    sortKey?: Key | undefined,
    limit?: number,
  ): Promise<Record<string, any>[]> => {
    // Partition key
    const ExpressionAttributeNames: { [key: string]: string; } = { '#pk': partitionKey.name };
    const ExpressionAttributeValues: { [key: string]: unknown; } = { ':pk': partitionKey.value };

    // Sort key
    if (sortKey) {
      ExpressionAttributeNames['#sk'] = sortKey.name;
      ExpressionAttributeValues[':sk'] = sortKey.value;
    }

    // Parameters
    const params: QueryCommandInput = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: sortKey ? '#pk = :pk AND begins_with ( #sk, :sk )' : '#pk = :pk',
      ExpressionAttributeNames: sortKey ? { ...ExpressionAttributeNames, '#sk': sortKey.name } : ExpressionAttributeNames,
      ExpressionAttributeValues: sortKey ? { ...ExpressionAttributeValues, '#sk': sortKey.value } : ExpressionAttributeValues,
      Limit: limit,
    };

    const result: Record<string, any>[] = [];
    let response: QueryCommandOutput;
    do {
      response = await documentClient.send(new QueryCommand(params));
      if (response.Items) {
        result.push(...response.Items);
      }
      params.ExclusiveStartKey = response.LastEvaluatedKey;
    } while (response.LastEvaluatedKey);

    return result;
  },

  /**
   * Selects a range of items between two sort keys
   * @param tableName DynamoDB table name
   * @param partitionKey The partition key to select
   * @param sortKey The starting/ending sort key values
   * @returns An array of items in the given sort key range
   */
  findItemRange: async (
    tableName: string,
    partitionKey: Key,
    sortKey: Range,
    indexName?: string,
  ): Promise<Record<string, any>[]> => {

    const params: QueryCommandInput = {
      TableName: tableName,
      IndexName: indexName,
      ExpressionAttributeNames: {
        '#pk': partitionKey.name,
        '#sk': sortKey.name,
      },
      ExpressionAttributeValues: {
        ':pk': partitionKey.value,
        ':from': sortKey.from,
        ':to': sortKey.to,
      },
      KeyConditionExpression: `#pk = :pk AND #sk BETWEEN :from AND :to`,
    };

    const result: Record<string, any>[] = [];
    let response: QueryCommandOutput;
    do {
      response = await documentClient.send(new QueryCommand(params));
      if (response.Items) {
        result.push(...response.Items);
      }
      params.ExclusiveStartKey = response.LastEvaluatedKey;
    } while (response.LastEvaluatedKey);

    return result;
  },

  /**
   * Put an item
   * @param tableName DynamoDB table name
   * @param item Must include the partition key and, if defined, the sort key
   */
  putItem: async (tableName: string, item: Record<string, any>) => {
    await documentClient.send(new PutCommand({
      TableName: tableName,
      Item: convertDates(item),
    }));
  },

  /**
   * Put a batch of items.
   * Internally this will make BatchWrite requests for up to 25 items at a time until all items have been processed.
   * @param tableName DynamoDB table name
   * @param items These must include the partition key and, if defined, the sort key
   */
  putItems: async (tableName: string, items: Record<string, any>[]) => {
    if (items.length === 0) return; // Short-circuit exit

    const remaining: Record<string, any>[] = [...items]; // Don't alter the source array, just in case
    while (remaining.length > 0) {
      // Remove a batch of up to 25 items (DDB limit)
      const batch = remaining.splice(-25);

      await documentClient.send(new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch.map((item) => ({
            PutRequest: {
              Item: convertDates(item),
            },
          })),
        },
      }));
    };
  },

  /**
   * Update an item
   * NB you can't update the partition key or sort key.
   * If you want to change these you'll need to delete the item and put a new one.
   * @param tableName DynamoDB table name
   * @param item Must include the partition key and, if defined, the sort key
   * @returns The attributes of the updated item
   */
  updateItem: async (tableName: string, key: Record<string, any>, values: Record<string, any>): Promise<Record<string, any> | undefined> => {
    const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } = createUpdateExpressions(convertDates(values));
    const response = await documentClient.send(new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression,
      ExpressionAttributeNames, // DynamoDB can be picky about reserved words like 'id' and 'type'. Using ExpressionAttributeNames avoids conflicts
      ExpressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return response.Attributes;
  },

  /**
   * Delete an item
   * @param tableName DynamoDB table name
   * @param key 1-2 fields: partition key (required) and, optionally, sort key
   * @returns The item, if found, or {}
   */
  deleteItem: async (tableName: string, key: Record<string, any>): Promise<Record<string, any> | undefined> => {
    const response = await documentClient.send(new DeleteCommand({
      TableName: tableName,
      Key: key,
    }));

    return response.Attributes;
  },

  /**
   * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
   * @param tableName DynamoDB table name
   * @returns All the items that match the partition key and begin with the sort key
   */
  listItems: async (
    tableName: string,
    partitionKey: Key,
    sortKey?: Key,
    // attributes?: string[],
  ): Promise<Record<string, any>[]> => {
    // Primary key
    let KeyConditionExpression = '#pk = :pk';
    const ExpressionAttributeNames: Record<string, any> = {
      '#pk': partitionKey.name,
    };
    const ExpressionAttributeValues: Record<string, any> = {
      ':pk': partitionKey.value,
    };

    // Sort key
    if (sortKey) {
      KeyConditionExpression = `${KeyConditionExpression} AND begins_with ( #sk, :sk )`;
      ExpressionAttributeNames['#sk'] = sortKey.name;
      ExpressionAttributeValues[':sk'] = sortKey.value;
    }

    // Parameters
    const params: QueryCommandInput = {
      TableName: tableName,
      KeyConditionExpression,
      ExpressionAttributeValues,
      ExpressionAttributeNames,
    };

    const result: Record<string, any>[] = [];
    let response;
    do {
      response = await documentClient.send(new QueryCommand(params));
      if (response.Items) response.Items.forEach((item) => result.push(item));
      params.ExclusiveStartKey = response.LastEvaluatedKey;
    } while (typeof response.LastEvaluatedKey !== 'undefined');

    return result;
  },

  /**
   * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
   * @param tableName DynamoDB table name
   * @param indexName DynamoDB table index
   * @param partitionKey The partition key to list items from
   * @returns All the items that match the partition key and begin with the sort key
   */
  listIndexItems: async (
    tableName: string,
    indexName: string,
    partitionKey: Key,
  ): Promise<Record<string, any>[]> => {

    const params: QueryCommandInput = {
      TableName: tableName,
      IndexName: indexName,
      KeyConditionExpression: `${partitionKey.name} = :value`,
      ExpressionAttributeValues: {
        ':value': partitionKey.value,
      },
    };

    const result: Record<string, any>[] = [];
    let response;
    do {
      response = await documentClient.send(new QueryCommand(params));
      if (response.Items) response.Items.forEach((item) => result.push(item));
      params.ExclusiveStartKey = response.LastEvaluatedKey;
    } while (typeof response.LastEvaluatedKey !== 'undefined');

    return result;
  },

  /**
   * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
   * @param tableName DynamoDB table name
   * @returns An array containing all the items (could get large!)
   */
  listTableItems: async (tableName: string): Promise<Record<string, any>[]> => {
    const params: ScanCommandInput = {
      TableName: tableName,
    };

    let result: ScanCommandOutput;
    const items: Record<string, any>[] = [];

    do {
      result = await documentClient.send(new ScanCommand(params));
      if (result.Items) items.push(...result.Items);
      params.ExclusiveStartKey = result.LastEvaluatedKey;
    } while (typeof result.LastEvaluatedKey !== 'undefined');

    return items;
  },

  /**
   * Data migration for a set of DynamoDB iems.
   * @param table The DDB table to write to
   * @param page A page of DDB items returned by the scan.
   * @param update A function that takes a DDB item as a parameter,
   * updates the object and returns it to be put bach to the table.
   * @returns The number of updates made
   */
  migratePage: async (
    table: string,
    page: Record<string, any>[],
    update: (item: Record<string, any>) => Record<string, any> | undefined,
  ): Promise<number> => {
    // Migrate items and filter out any blanks (aka items that don't need to be updated)
    const items = page.map((item) => update(item)).filter((item) => item !== undefined);
    await DynamoDB.putItems(table, items);

    console.log(`Processed ${items.length} updates from a page of ${page.length}`);
    return items.length;
  },

  /**
   * Data migration for a DynamoDB table.
   * @param update A function that takes a DDB item as a parameter,
   * updates the object and returns it to be put bach to the table.
   * @param sourceTable The DDB table to scan
   * @param destinationTable (Optional) The DDP table to updated items into,
   * If not provided, items are put back to the source table.
   */
  migrate: async (update: (item: Record<string, any>) => Record<string, any> | undefined, sourceTable: string, destinationTable?: string): Promise<number> => {
    const params: ScanCommandInput = {
      TableName: sourceTable,
    };

    let itemCount = 0;
    let updateCount = 0;
    let result: ScanCommandOutput;

    do {
      result = await documentClient.send(new ScanCommand(params));
      if (result.Items) {
        itemCount += result.Items.length;
        updateCount += await DynamoDB.migratePage(destinationTable || sourceTable, result.Items, update);
      }
      console.log(`Migrated ${updateCount} of ${itemCount} items`);
      params.ExclusiveStartKey = result.LastEvaluatedKey;
    } while (result.LastEvaluatedKey);

    return updateCount;
  },

  removeAttribute: async (table: string, attribute: string, dryRun: boolean = true): Promise<number> => {
    let count = 0;
    await DynamoDB.migrate(item => {
      if (item[attribute]) count++;
      delete item[attribute];
      return dryRun ? undefined : item;
    }, table);

    console.log(`Removed ${count} ${attribute} attributes from ${table}`);
    return count;
  },

};





// /**
//  * Selects a range of items between two sort keys
//  * @param tableName DynamoDB table name
//  * @param partitionKey The partition key to select
//  * @param sortKey The starting/ending sort key values
//  * @returns An array of items in the given sort key range
//  */
// export async function findItemRange(
//   tableName: string,
//   partitionKey: Key,
//   sortKey: Range,
//   attributes?: string[],
// ): Promise<Record<string, any>[]> {
//   const params: any = {
//     TableName: tableName,
//     KeyConditionExpression: `#${partitionKey.name} = :pk AND #${sortKey.name} BETWEEN :from AND :to`,
//     ExpressionAttributeValues: {
//       ':pk': partitionKey.value,
//       ':from': sortKey.from,
//       ':to': sortKey.to,
//     },
//     ExpressionAttributeNames: {}, // Computed below
//   };
//   const attributeNames = [partitionKey.name, sortKey.name];

//   // List of attributes to get
//   if (attributes) {
//     params.ProjectionExpression = attributes.map((attribute) => `#${attribute}`).join(',');
//     attributes.forEach((attribute) => {
//       attributeNames.push(attribute);
//     });
//   }

//   // Expression attribute names - this avoids clasking with DDB reserved words
//   attributeNames.forEach((attributeName) => {
//     params.ExpressionAttributeNames[`#${attributeName}`] = `${attributeName}`;
//   });

//   const result: Record<string, any>[] = [];
//   let items;
//   do {
//     // eslint-disable-next-line no-await-in-loop
//     items = await ddb.query(params).promise();
//     if (items.Items) items.Items.forEach((item) => result.push(item));
//     params.ExclusiveStartKey = items.LastEvaluatedKey;
//   } while (typeof items.LastEvaluatedKey !== 'undefined');

//   return result;
// }
