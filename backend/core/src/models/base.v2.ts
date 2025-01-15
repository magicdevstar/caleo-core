import { Collection, Db, ObjectId, UpdateResult } from "mongodb";
import DataLoader from 'dataloader';
import { DocType } from "../__generated__/resolvers-types";
import { GraphQLError } from "graphql";
import logger from "../utils/logger";
import { SearchResults } from "../utils/common.resolvers";

export interface InputModel {
  orgId: ObjectId;
  modifiedById: ObjectId | string;
  createdById?: ObjectId | string;
}

interface IBulkWriteInput extends InputModel {
  _id?: ObjectId;
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
    protected validator: Validations<T> = {},
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

    if (this.validator.create) {
      await this.validator.create(insertDoc as any);
    }

    const res = await this.collection.insertOne(insertDoc);

    const createdDoc = {
      ...insertDoc,
      _id: res.insertedId,
      id: res.insertedId.toString(),
      createdAt: now,
      updatedAt: now,
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

  async get(
    id: string | ObjectId,
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

  async update<T extends UpdateModel>({id, ...item}: T, unset?: any): Promise<T> {
    const now = new Date();
    const updateDoc = {
      ...item,
      updatedAt: now,
    };

    const res = await this.collection.updateOne({
      _id: new ObjectId(id),
    }, {
      $set: updateDoc,
      ...(unset && { $unset: unset }),
    });

    if (res.modifiedCount === 0) {
      throw new GraphQLError(`${this.typeName} not found`);
    }

    return {id, ...updateDoc} as unknown as T;
  }

  async upsert<T extends UpsertModel>(item: T): Promise<T> {
    if (typeof item.modifiedById === 'string') {
      item.modifiedById = new ObjectId(item.modifiedById);
    }
    if (!item.id) {
      item.createdById = item.modifiedById;
      return this.create(item);
    }
    return this.update(item as UpdateModel) as Promise<T>;
  }

  async remove(id: string | ObjectId, setValues?: any): Promise<void> {
    const now = new Date();
    await this.collection.updateOne({
      _id: new ObjectId(id)
    }, {
      $set: {
        removedAt: new Date(),
        updatedAt: new Date(),
        ...(setValues || {})
      },
    });
  }

  async bulkWrite<T extends IBulkWriteInput>(items: T[]): Promise<T[]> {
    const now = new Date();
    const bulkDocs = items.map((item) => {
      if (item._id) {
        return {
          updateOne: {
            filter: { _id: item._id },
            update: {
              $set: {
                ...item,
                docType: this.docType,
                updatedAt: now,
              }
            },
          }
        };
      }
      return {
        insertOne: {
          document: {
            ...item,
            docType: this.docType,
            updatedAt: now,
            createdAt: now,
          },
        },
      };
    });

    await this.collection.bulkWrite(bulkDocs);

    return bulkDocs.map((item) => {
      if (item.updateOne) {
        return {
          ...item.updateOne.update.$set,
          _id: item.updateOne.filter._id,
          id: item.updateOne.filter._id.toString(),
        };
      }
      return {
        ...item.insertOne.document,
        // This is added by mongo after the bulk write is complete :)
        id: (item.insertOne.document as any)._id.toString(),
      }
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
    const now = new Date();
    return this.collection.updateMany(filter, {
      $set: {
        removedAt: now,
        updatedAt: now,    
        ...(setValues || {}),
      },
    });
  }
}
