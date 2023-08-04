import { Db, Collection, ObjectId } from 'mongodb';
import { DocType, NewUser, UpdateUser, User } from '../__generated__/resolvers-types';
import logger from '../utils/logger';
import { GraphQLError } from 'graphql';
import { userErrors } from '../utils/errors';

export class UserModel {
  collectionName: string = process.env.MONGODB_COLLECTION!;
  collection: Collection;
  constructor(private db: Db) {
    this.collection = this.db.collection(this.collectionName);
  }

  public async createUser(inputUser: NewUser): Promise<User> {
    const now = Date.now();
    const insertDoc = {
      ...inputUser,
      docType: DocType.User,
      createdAt: now,
      updatedAt: now,
    };

    const res = await this.collection.insertOne(insertDoc);

    const user: User = {
      id: res.insertedId.toString(),
      ...insertDoc,
      member: insertDoc.member as any,
      createdAt: insertDoc.createdAt as any,
      updatedAt: insertDoc.updatedAt as any,
    };
    logger.info('User created', { res, user });
    return user;
  }

  public async updateUser(inputUser: UpdateUser): Promise<User> {
    const now = Date.now();

    const existingUser = await this.collection.findOne({ _id: new ObjectId(inputUser.id), docType: DocType.User });

    if (!existingUser) {
      throw new GraphQLError('User not found', {
        extensions: {
          code: userErrors.USER_NOT_FOUND,
          argumentName: 'id',
        },
      });
    }

    const updateDoc = {
      ...existingUser,
      ...inputUser,
      updatedAt: now as any,
    };
    await this.collection.updateOne({ id: inputUser.id }, { $set: updateDoc });
    logger.info('User updated', { user: updateDoc });
    return updateDoc as any;
  }
}