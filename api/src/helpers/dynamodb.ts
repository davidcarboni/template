/* eslint-disable @typescript-eslint/no-explicit-any */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, BatchWriteCommand, UpdateCommand,
  ScanCommandInput, ScanCommand,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

//
// *** Note: This is a work in progress! ***
//
// Not all of these functions will behave as expected
// However the basics of get/put should be fine
//

// https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/dynamodb-example-dynamodb-utilities.html
// https://github.com/awsdocs/aws-doc-sdk-examples/tree/main/javascriptv3/example_code/dynamodb/actions/document-client

export const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient(),
  // This should handle keys that are undefined
  { marshallOptions: { removeUndefinedValues: true } },
);

export interface Key {
  name: string,
  value: any,
}

export interface Range {
  name: string,
  from: any,
  to: any,
}

export function ttlMinutes(minutes: number) {
  const date = new Date();
  date.setDate(date.getMinutes() + minutes);
  return Math.floor(date.getTime() / 1000.0);
}

export function ttlHours(hours: number) {
  const date = new Date();
  date.setDate(date.getHours() + hours);
  return Math.floor(date.getTime() / 1000.0);
}

export function ttlDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return Math.floor(date.getTime() / 1000.0);
}

export function ttlMonths(months: number) {
  const date = new Date();
  date.setDate(date.getMonth() + months);
  return Math.floor(date.getTime() / 1000.0);
}

export function ttlYears(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() + years);
  return Math.floor(date.getTime() / 1000.0);
}

/**
 * Get an item
 * @param tableName DynamoDB table name
 * @param key 1-2 fields: partition key (required) and, optionally, sort key
 * @returns The item, if found, or {}
 */
export async function getItem(tableName: string, key: { [key: string]: any; })
  : Promise<{ [key: string]: any; } | undefined> {
  const response = await documentClient.send(new GetCommand({
    TableName: tableName,
    Key: key,
  }));
  return response.Item;
}

/**
 * Delete an item
 * @param tableName DynamoDB table name
 * @param key 1-2 fields: partition key (required) and, optionally, sort key
 * @returns The item, if found, or {}
 */
export async function deleteItem(tableName: string, key: { [key: string]: any; })
  : Promise<{ [key: string]: any; } | undefined> {
  const response = await documentClient.send(new DeleteCommand({
    TableName: tableName,
    Key: key,
  }));
  return response.Attributes;
}

/**
 * Get an item using an index
 * @param tableName DynamoDB table name
 * @param indexName Index name
 * @param id The item ID (partition key)
 * @returns The item, if found, or {}
 */
export async function getIndex(tableName: string, indexName: string, indexKey: string, indexValue: any)
  : Promise<{ [key: string]: any; } | undefined> {
  const response = await documentClient.send(new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: `${indexKey} = :value`,
    ExpressionAttributeValues: {
      ':value': indexValue,
    },
  }));
  return response.Items && response.Items.length > 0 ? response.Items[0] : undefined;
}

/**
 * Put an item
 * @param tableName DynamoDB table name
 * @param item Must include the partition key and, if defined, the sort key
 */
export async function putItem(tableName: string, item: { [key: string]: any; }) {
  await documentClient.send(new PutCommand({
    TableName: tableName,
    Item: item,
  }));
}

/**
 * Put a batch of items.
 * Internally this will make BatchWrite requests for up to 25 items at a time until all items have been processed.
 * @param tableName DynamoDB table name
 * @param items These must include the partition key and, if defined, the sort key
 */
export async function putItems(tableName: string, items: { [key: string]: any; }[]) {
  if (items.length === 0) return; // Short-circuit exit

  let remaining: { [key: string]: any; }[] = items;
  do {
    // Select a batch of up to 25 items
    const batch = remaining.slice(0, 25);
    remaining = remaining.slice(25);

    // For every chunk of 25 items, make one BatchWrite request.
    const putRequests = batch.map((Item) => ({
      PutRequest: {
        Item,
      },
    }));

    documentClient.send(new BatchWriteCommand({
      RequestItems: {
        [tableName]: putRequests,
      },
    }));
  } while (remaining.length > 0);
}

/**
 * Generate the UpdateExpression, ExpressionAttributeNames, and ExpressionAttributeValues parameters for updateItem
 */
function createUpdateExpressions(item: { [key: string]: any; }) {
  const UpdateExpression: string[] = [];
  const ExpressionAttributeValues: { [key: string]: any; } = {};
  const ExpressionAttributeNames: { [key: string]: any; } = {};
  Object.keys(item).forEach((key) => {
    UpdateExpression.push(`#${key} = :${key}`);
    ExpressionAttributeNames[`#${key}`] = key;
    ExpressionAttributeValues[`:${key}`] = item[key];
  });
  return { UpdateExpression: `SET ${UpdateExpression.join(', ')}`, ExpressionAttributeNames, ExpressionAttributeValues };
}

/**
 * Update an item
 * NB you can't update the partition key or sort key.
 * If you want to change these you'll need to delete the item and put a new one.
 * @param tableName DynamoDB table name
 * @param item Must include the partition key and, if defined, the sort key
 * @returns The attributes of the updated item
 */
export async function updateItem(tableName: string, key: { [key: string]: any; }, values: { [key: string]: any; })
  : Promise<Record<string, any> | undefined> {
  const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } = createUpdateExpressions(values);
  const response = await documentClient.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression,
    ExpressionAttributeNames, // DynamoDB can be picky about reserved words like 'id' and 'type'. Using ExpressionAttributeNames avoids conflicts
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));
  return response.Attributes;
}

/**
 * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
 * @param tableName DynamoDB table name
 * @returns All the items that match the partition key and begin with the sort key
 */
export async function findItems(
  tableName: string,
  partitionKey: Key,
  sortKey?: Key,
  // attributes?: string[],
): Promise<{ [key: string]: any; }[]> {
  // Primary key
  let KeyConditionExpression = '#pk = :pk';
  const ExpressionAttributeNames: { [key: string]: any; } = {
    '#pk': partitionKey.name,
  };
  const ExpressionAttributeValues: { [key: string]: any; } = {
    ':pk': partitionKey.value,
  };

  // Sort key
  if (sortKey) {
    KeyConditionExpression = `${KeyConditionExpression} AND begins_with ( #sk, :sk )`;
    ExpressionAttributeNames['#sk'] = sortKey.name;
    ExpressionAttributeValues[':sk'] = sortKey.value;
  }

  // Parameters
  const params: any = {
    TableName: tableName,
    KeyConditionExpression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  };
  // const attributeNames = [partitionKey.name, sortKey.name];

  // List of attributes to get
  // if (attributes) {
  //   params.ProjectionExpression = attributes.map((attribute) => `#${attribute}`).join(',');
  //   attributes.forEach((attribute) => {
  //     attributeNames.push(attribute);
  //   });
  // }

  // Expression attribute names - this avoids clashing with DDB reserved words
  // attributeNames.forEach((attributeName) => {
  //   params.ExpressionAttributeNames[`#${attributeName}`] = `${attributeName}`;
  // });

  const result: { [key: string]: any; }[] = [];
  let response;
  do {
    response = await documentClient.send(new QueryCommand(params));
    if (response.Items) response.Items.forEach((item) => result.push(item));
    params.ExclusiveStartKey = response.LastEvaluatedKey;
  } while (typeof response.LastEvaluatedKey !== 'undefined');

  return result;
}

// /**
//  * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
//  * @param tableName DynamoDB table name
//  * @param indexName DynamoDB table index
//  * @returns All the items that match the partition key and begin with the sort key
//  */
// export async function findItemsIndex(
//   tableName: string,
//   indexName: string,
//   partitionKey: Key,
//   sortKey?: Key,
// ) : Promise<{ [key: string]: any; }[]> {
//   const params: DocumentClient.QueryInput = {
//     TableName: tableName,
//     IndexName: indexName,
//     KeyConditionExpression: sortKey ? '#pk = :pk AND begins_with ( #sk, :sk )' : '#pk = :pk',
//     ExpressionAttributeNames: {
//       '#pk': partitionKey.name,
//     },
//     ExpressionAttributeValues: {
//       ':pk': partitionKey.value,
//     },
//   };

//   // Add sort key if specified
//   if (sortKey) {
//     params.ExpressionAttributeNames = params.ExpressionAttributeNames || {}; // Some Typrscript issue?
//     params.ExpressionAttributeValues = params.ExpressionAttributeValues || {}; // Some Typrscript issue?
//     params.ExpressionAttributeNames['#sk'] = sortKey.name;
//     params.ExpressionAttributeValues[':sk'] = sortKey.value;
//   }

//   const result: { [key: string]: any }[] = [];
//   let items;
//   do {
//     // eslint-disable-next-line no-await-in-loop
//     items = await ddb.query(params).promise();
//     if (items.Items) items.Items.forEach((item) => result.push(item));
//     params.ExclusiveStartKey = items.LastEvaluatedKey;
//   } while (typeof items.LastEvaluatedKey !== 'undefined');

//   return result;
// }

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
// ): Promise<{ [key: string]: any }[]> {
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

//   const result: { [key: string]: any }[] = [];
//   let items;
//   do {
//     // eslint-disable-next-line no-await-in-loop
//     items = await ddb.query(params).promise();
//     if (items.Items) items.Items.forEach((item) => result.push(item));
//     params.ExclusiveStartKey = items.LastEvaluatedKey;
//   } while (typeof items.LastEvaluatedKey !== 'undefined');

//   return result;
// }

/**
 * https://stackoverflow.com/questions/44589967/how-to-fetch-scan-all-items-from-aws-dynamodb-using-node-js
 * @param tableName DynamoDB table name
 * @returns An array containing all the items (could get large!)
 */
export async function listItems(tableName: string): Promise<Record<string, any>[]> {
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
}

/**
 * Data migration for a set of DynamoDB iems.
 * @param table The DDB table to write to
 * @param page A page of DDB items returned by the scan.
 * @param update A function that takes a DDB item as a parameter,
 * updates the object and returns it to be put bach to the table.
 * @returns The number of updates made
 */
export async function migratePage(
  table: string,
  page: any[],
  update: (item: any) => any,
): Promise<number> {
  // Migrate items and filter out any blanks (aka items that don't need to be updated)
  const items = page.map((item) => update(item)).filter((item) => item);
  await putItems(table, items);

  console.log(`Processed ${items.length} updates from a page of ${page.length}`);
  return items.length;
}

/**
 * Data migration for a DynamoDB table.
 * @param update A function that takes a DDB item as a parameter,
 * updates the object and returns it to be put bach to the table.
 * @param sourceTable The DDB table to scan
 * @param destinationTable (Optional) The DDP table to updated items into,
 * If not provided, items are put back to the source table.
 */
export async function migrate(update: (item: any) => any | undefined, sourceTable: string, destinationTable?: string): Promise<number> {
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
      updateCount += await migratePage(destinationTable || sourceTable, result.Items, update);
    }
    console.log(`Migrated ${updateCount} of ${itemCount} items`);
    params.ExclusiveStartKey = result.LastEvaluatedKey;
  } while (typeof result.LastEvaluatedKey !== 'undefined');

  return updateCount;
}
