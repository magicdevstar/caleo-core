import { Db, Collection, ObjectId } from 'mongodb';
import { DocType, Rank, UpsertRank } from '../__generated__/resolvers-types';
import logger from '../utils/logger';
import { GraphQLError } from 'graphql';
import { rankErrors } from '../utils/errors';

interface InputRank extends UpsertRank {
  orgId: string;
}

export class RankModel {
  collectionName: string = process.env.MONGODB_COLLECTION!;
  collection: Collection;
  constructor(private db: Db) {
    this.collection = this.db.collection(this.collectionName);
  }

  async create(inputRank: InputRank): Promise<Rank> {
    const now = Date.now();
    const insertDoc = {
      ...inputRank,
      docType: DocType.Rank,
      createdAt: now,
      updatedAt: now,
    };

    const found = await this.findOne({ name: inputRank.name });

    if (found) {
      throw new GraphQLError('Rank name must be unique', {
        extensions: {
          code: rankErrors.RANK_NAME_MUST_BE_UNIQUE,
          argumentName: 'name',
        },
      });
    }

    const res = await this.collection.insertOne(insertDoc);

    const rank = {
      ...insertDoc,
      id: res.insertedId.toString(),
      createdAt: insertDoc.createdAt as any,
      updatedAt: insertDoc.updatedAt as any,
    } as Rank;
    logger.info('Rank created', { res, rank });
    return rank;
  }

  async findOne(query: any): Promise<Rank | null> {
    const res = await this.collection.findOne({
      ...query,
      docType: DocType.Rank,
    });
    if (!res) {
      return null;
    }
    return {
      ...(res as any),
      id: res._id.toString(),
    } as Rank;
  }

  async get(id: string): Promise<Rank | null> {
    const res = await this.collection.findOne({
      _id: new ObjectId(id),
      docType: DocType.Rank,
    });
    if (!res) {
      return null;
    }
    return {
      ...(res as any),
      id: res._id.toString(),
    } as Rank;
  }

  async update(upsertRank: InputRank): Promise<Rank> {
    const now = Date.now();

    const existingRank = await this.get(upsertRank.id!);

    if (!existingRank) {
      throw new GraphQLError('User not found', {
        extensions: {
          code: rankErrors.RANK_NOT_FOUND,
          argumentName: 'id',
        },
      });
    }

    const updateDoc = {
      ...existingRank,
      ...upsertRank,
      docType: DocType.Rank,
      updatedAt: now as any,
    } as Rank;

    await this.collection.updateOne({ id: upsertRank.id }, { $set: updateDoc });

    return updateDoc;
  }

  async upsert(upsertRank: InputRank) {
    if (!upsertRank.id) {
      return this.create(upsertRank);
    }
    return this.update(upsertRank);
  }

  async search(): Promise<Rank[]> {
    const res = await this.collection.find({
      docType: DocType.Rank
    }).toArray();
    return res.map(({_id, ...rank}) => ({
      ...rank,
      id: _id.toString(),
    } as Rank));
  }

  async remove(id: string): Promise<void> {
    await this.collection.deleteOne({ _id: new ObjectId(id), docType: DocType.Rank });
  }
}