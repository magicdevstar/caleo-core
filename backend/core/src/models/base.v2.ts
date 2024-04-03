import { AnyBulkWriteOperation, Collection, Db, ObjectId, UpdateResult } from "mongodb";
import DataLoader from 'dataloader';
import merge from 'lodash.merge';
import { DocType } from "../__generated__/resolvers-types";
import { GraphQLError } from "graphql";
import logger from "../utils/logger";
import { SearchResults } from "../utils/common.resolvers";

export interface InputModel {
  orgId: ObjectId;
}

interface UpdateModel extends InputModel {
  id: string;
}

interface UpsertModel extends InputModel {
  id?: string;
}

export interface Validations<T> {
  create?: (insertDoc: T) => Promise<void>;
}

export class BaseMongo<T> {
  collection: Collection;
  typeName: string = '';

  public loader = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.findAll(ids, { includedRemoved: true });
    return keys.map((key) => res.find((item: any) => item.id === key));
  });

  constructor(
    protected db: Db,
    private docType: DocType,
    private collectionName: string = process.env.MONGODB_COLLECTION!,
  ) {
    this.collection = this.db.collection(this.collectionName);
    this.typeName = docType.charAt(0).toUpperCase() + this.docType.slice(1).toLowerCase();
  }

  async create<T extends InputModel>(item: T): Promise<T> {
    const now = new Date();
    const insertDoc = {
      ...item,
      docType: this.docType,
      createdAt: now,
      updatedAt: now,
    };

    const res = await this.collection.insertOne(insertDoc);

    const createdDoc = {
      ...insertDoc,
      _id: res.insertedId,
      id: res.insertedId.toString(),
      createdAt: now as any,
      updatedAt: now as any,
    } as T;
    return createdDoc;
  }

  async findAll(ids: ObjectId[], { includedRemoved = false } = {}): Promise<T[]> {
    const res = await this.collection.find({
      _id: { $in: ids },
      ...(includedRemoved ? {} : { removedAt: { $exists: false } }),
    }).toArray();
    return res.map((item) => ({
      ...item,
      id: item._id.toString(),
    } as T));
  }

  async find(query: any, { includedRemoved = false } = {}): Promise<T[]> {
    const res = await this.collection.find({
      ...query,
      ...(includedRemoved ? {} : { removedAt: { $exists: false } }),
    }).toArray();
    return res.map((item) => ({
      ...item,
      id: item._id.toString(),
    } as T));
  }

  async get(
    id: string,
    { removed = false } = {}
  ): Promise<T | null> {
    const res = await this.collection.findOne({
      _id: new ObjectId(id),
      ...(removed ? {} : { removedAt: { $exists: false } }),
    });
    if (!res) {
      return null;
    }
    return {
      ...(res as any),
      id: res._id.toString(),
    } as T;
  }

  async bulkWrite<T extends UpdateModel>(items: T[]): Promise<T[]> {
    const now = new Date();

    const bulkDocs = items.map((item) => {
      if (item.id) {
        const { id, ...restOfItem } = item;
        return {
          updateOne: {
            filter: { _id: new ObjectId(id) },
            update: {
              $set: {
                ...restOfItem,
                docType: this.docType,
                updatedAt: now as any,
              }
            },
          }
        }
      }
      return {
        insertOne: {
          document: {
            ...item,
            docType: this.docType,
            updatedAt: now as any,
          }
        },
      };
    }) as any;
    const updateRes = await this.collection.bulkWrite(bulkDocs);

    return bulkDocs.map((doc) => {
      if (doc.updateOne) {
        return {
          ...doc.updateOne.update.$set,
          id: doc.updateOne.filter._id.toString(),
        };
      }
      const { _id: id, ...rest } = doc.insertOne.document;
      return {
        ...rest,
        id: id.toString(),
      };
    });
  }

  async update<T extends UpdateModel>(item: T, options: { skipMerge?: boolean } = {}): Promise<T> {
    const now = new Date();

    let updateDoc: T = item;
    if (!options.skipMerge) {
      const existingDoc = await this.get(item.id!);
  
      if (!existingDoc) {
        throw new GraphQLError(`${this.typeName} not found`, {
          extensions: {
            code: `${this.docType}_NOT_FOUND`,
            argumentName: 'id',
          },
        });
      }
  
      updateDoc = merge(existingDoc, item, {
        docType: this.docType,
        updatedAt: now as any,
      }) as T;
    }
    const { id, ...upDoc } = updateDoc;

    await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: upDoc });
    return updateDoc;
  }

  async replace<T extends UpdateModel>(item: T): Promise<T> {
    const now = new Date();

    let updateDoc: T = item;
    const { id, ...upDoc } = updateDoc;

    await this.collection.replaceOne({ _id: new ObjectId(id) }, {
      ...upDoc,
      updatedAt: now,
    });

    return updateDoc;
  }

  async upsert<T extends UpsertModel>(item: T): Promise<T> {
    if (!item.id) {
      (item as any).createdById = (item as any).modifiedById;
      return this.create(item);
    }
    return this.update(item as UpdateModel) as Promise<T>;
  }

  async remove(id: string, setValues?: any): Promise<void> {
    await this.collection.updateOne({
      _id: new ObjectId(id)
    }, {
      $set: {
        removedAt: new Date(),
        ...(setValues || {})
      },
    });
  }

  async search(searchInput: any = {}): Promise<SearchResults<T>> {
    const {
      skip,
      limit,
      order,
      orderBy,
      query,
      queryField,
      includeRemoved = false,
      ...rest
    } = searchInput;

    // Ignore any removed items
    if (!includeRemoved) {
      rest.removedAt = { $exists: false };
    }

    let textQuery: any = {};
    if (query) {
      const fieldName = queryField || 'name';
      textQuery[fieldName] = {
        $regex: query,
        $options: 'i',
      };
    }

    const transaction = this.collection.find({
      ...rest,
      ...textQuery,
    });

    logger.info('Search', {
      find: {
        ...rest,
        ...textQuery,
      }
    });

    if (order && orderBy) {
      transaction.sort({ [orderBy]: order === 'asc' ? 1 : -1 });
    } else {
      transaction.sort({ createdAt: -1 });
    }

    if (skip) {
      transaction.skip(skip);
    }
    if (limit) {
      transaction.limit(limit);
    }

    const res = await transaction.toArray();

    const items = res.map((item) => ({
      ...item,
      id: item._id.toString(),
    } as T));

    const total = await this.collection.countDocuments({
      ...rest,
      ...textQuery,
    });

    return {
      items,
      total,
    };
  }

  async removeMany(filter: any, setValues?: any): Promise<UpdateResult<Document>> {
    return this.collection.updateMany(filter, {
      $set: {
        removedAt: new Date(),
        ...(setValues || {}),
      },
    });
  }
}
