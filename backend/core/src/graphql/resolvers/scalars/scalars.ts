import { GraphQLScalarType, Kind } from 'graphql';
import { ObjectId } from 'mongodb';

// Date scalar for date-only values (YYYY-MM-DD)
export const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type representing a date without time information',
  
  // Convert outgoing Date to string
  serialize(value) {
    if (value instanceof Date) {
      // Format as ISO date string and trim time part
      return value.toISOString().split('T')[0];
    }
    // Handle string dates
    if (typeof value === 'string') {
      return value.split('T')[0];
    }
    // Handle timestamp
    if (typeof value === 'number') {
      return new Date(value).toISOString().split('T')[0];
    }
    throw new Error('Invalid Date scalar value');
  },
  
  // Convert string to Date
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new Error('Date scalar must be a string');
    }
    // Use ISO format date string to create Date
    return new Date(value);
  },
  
  // Parse AST literal to Date
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new Error('Date scalar must be a string');
    }
    return new Date(ast.value);
  },
});

// DateTime scalar for date with time values
export const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type representing a date and time',
  
  // Convert outgoing Date to ISO string
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    // Handle string datetimes
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    // Handle timestamp
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new Error('Invalid DateTime scalar value');
  },
  
  // Convert string to Date
  parseValue(value) {
    if (typeof value !== 'string') {
      throw new Error('DateTime scalar must be a string');
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid DateTime scalar value');
    }
    return date;
  },
  
  // Parse AST literal to Date
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new Error('DateTime scalar must be a string');
    }
    const date = new Date(ast.value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid DateTime scalar value');
    }
    return date;
  },
});

export const ObjectIdScalar = new GraphQLScalarType({
  name: 'ObjectId',
  description: 'MongoDB ObjectId scalar type',
  
  // Convert outgoing ObjectId to string
  serialize(value) {
    if (value instanceof ObjectId) {
      return value.toHexString();
    }
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('ObjectId scalar serializer expected a ObjectId or string');
  },
  
  // Convert string to ObjectId
  parseValue(value) {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new Error('ObjectId scalar parser expected a string');
    }

    if (value.trim() === '') {
      return null;
    }
    
    if (ObjectId.isValid(value)) {
      return new ObjectId(value);
    }
    
    throw new Error(`Value is not a valid ObjectId: ${value}`);
  },
  
  // Parse AST literal to ObjectId
  parseLiteral(ast) {
    if (ast.kind === Kind.NULL) {
      return null;
    }

    if (ast.kind !== Kind.STRING) {
      throw new Error('ObjectId scalar parser expected a string');
    }

    if (ast.value.trim() === '') {
      return null;
    }
    
    if (ObjectId.isValid(ast.value)) {
      return new ObjectId(ast.value);
    }
    
    throw new Error(`Value is not a valid ObjectId: ${ast.value}`);
  },
});
