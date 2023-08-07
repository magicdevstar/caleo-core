import { Collection, Db, ObjectId } from "mongodb";
import DataLoader from 'dataloader';
import merge from 'lodash.merge';
import { DocType } from "../__generated__/resolvers-types";
import { GraphQLError } from "graphql";
import logger from "../utils/logger";
import { SearchResults } from "../utils/common.resolvers";

export interface InputModel {
  orgId: string;
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

export class BaseModel<T> {
  collectionName: string = process.env.MONGODB_COLLECTION!;
  collection: Collection;
  typeName: string = '';

  public loader = new DataLoader(async (keys: readonly string[]) => {
    const ids = keys.map((key) => new ObjectId(key));
    const res = await this.findAll(ids);
    return keys.map((key) => res.find((item: any) => item.id === key));
  });

  constructor(
    protected db: Db,
    private docType: DocType,
    protected validator: Validations<T> = {},
  ) {
    this.collection = this.db.collection(this.collectionName);
    this.typeName = docType.charAt(0).toUpperCase() + this.docType.slice(1).toLowerCase();
  }

  async create<T extends InputModel>(item: T): Promise<T> {
    const now = Date.now();
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
      id: res.insertedId.toString(),
      createdAt: insertDoc.createdAt as any,
      updatedAt: insertDoc.updatedAt as any,
    } as T;
    logger.info(`${this.typeName} created`, { res, createdDoc });
    return createdDoc;
  }

  async findAll(ids: ObjectId[]): Promise<T[]> {
    const res = await this.collection.find({
      _id: { $in: ids },
      docType: this.docType,
    }).toArray();
    return res.map(({_id, ...item}) => ({
      ...item,
      id: _id.toString(),
    } as T));
  }

  async findOne(query: any): Promise<T | null> {
    const res = await this.collection.findOne({
      ...query,
      docType: this.docType,
    });
    if (!res) {
      return null;
    }
    const { _id, ...rest } = res;
    return {
      ...(rest as any),
      id: _id.toString(),
    } as T;
  }

  async get(id: string): Promise<T | null> {
    const res = await this.collection.findOne({
      _id: new ObjectId(id),
      docType: this.docType,
    });
    if (!res) {
      return null;
    }
    const { _id, ...rest } = res;
    return {
      ...(rest as any),
      id: _id.toString(),
    } as T;
  }

  async update<T extends UpdateModel>(item: T, options: { skipMerge?: boolean } = {}): Promise<T> {
    const now = Date.now();

    let updateDoc: T = item;
    if (!options.skipMerge) {
      const existingDoc = await this.get(item.id);
  
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

    logger.info('Update document', { updateDoc: upDoc });
    const updateRes = await this.collection.updateOne({ _id: new ObjectId(id) }, { $set: upDoc });
    logger.info('Update document result', { updateRes });

    return updateDoc;
  }

  async upsert<T extends UpsertModel>(item: T): Promise<T> {
    if (!item.id) {
      return this.create(item);
    }
    return this.update(item as UpdateModel) as Promise<T>;
  }

  async search(query: any = {}): Promise<SearchResults<T>> {
    const { skip, limit, ...rest } = query;
    const transaction = this.collection.find({
      ...rest,
      docType: this.docType,
    });

    if (skip) {
      transaction.skip(skip);
    }
    if (limit) {
      transaction.limit(limit);
    }

    const res = await transaction.toArray();

    const items = res.map(({_id, ...item}) => ({
      ...item,
      id: _id.toString(),
    } as T));

    const total = await this.collection.countDocuments({
      ...rest,
      docType: this.docType,
    });

    return {
      items,
      total,
    };
  }

  async remove(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: new ObjectId(id), docType: this.docType });
  }
}