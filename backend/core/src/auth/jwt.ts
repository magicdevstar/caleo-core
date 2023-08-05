import https from 'https';
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

interface PublicKeys {
  keys: PublicKey[];
}
interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}
interface PublicKeyMeta {
  instance: PublicKey;
  pem: string;
}
interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}
let cacheKeys: MapOfKidToPublicKey | undefined;

const cognitoPoolId = process.env.COGNITO_POOL_ID!;
const cognitoIssuer = `https://cognito-idp.${process.env.REGION}.amazonaws.com/${cognitoPoolId}`;

/**
 * @returns - returns a map of AWS Cognito public keys by kid (key ID). this public key can be used to verify the signature of a jwt token
 */
const getPublicKeys = async (): Promise<MapOfKidToPublicKey> => {
  if (!cacheKeys) {
    const url = `${cognitoIssuer}/.well-known/jwks.json`;
    const publicKeys: PublicKeys = await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        if (response.statusCode === 200) {
          let body = '';
          response.on('data', (chunk) => {
            body += chunk;
          });
          response.on('end', () => {
            resolve(JSON.parse(body));
          });
        } else {
          reject(
            `Error getting public keys for cognito pool: ${response.statusCode}`
          );
        }
      });
    });
    cacheKeys = publicKeys.keys.reduce((agg, current) => {
      const pem = jwkToPem(current);
      agg[current.kid] = { instance: current, pem };
      return agg;
    }, {} as MapOfKidToPublicKey);
    return cacheKeys;
  } else {
    return cacheKeys;
  }
};

/**
 *
 * Resources
 * https://cognito-idp.us-east-1.amazonaws.com/{cognitoPoolId}.well-known/jwks.json
 *
 * https://tools.ietf.org/html/rfc7517
 *
 * @param - kid - Key ID of public key used to sign JWT
 * @returns - return a JSON Web Key (JWK) for kid
 */
const getJwkByKid = async (kid: string): Promise<PublicKey | null> => {
  const keys = await getPublicKeys();
  const publicKey: PublicKeyMeta = keys[kid];

  // if the public key is missing reload cache and try one more time
  // https://forums.aws.amazon.com/message.jspa?messageID=747599
  if (!publicKey) {
    cacheKeys = undefined;
    const keys2 = await getPublicKeys();
    const publicKey2: PublicKeyMeta = keys2[kid];
    if (!publicKey2) {
      return null;
    }
    return publicKey2.instance;
  }
  return publicKey.instance;
}

export const validateToken = async (token: string) => {
  // https://github.com/awslabs/aws-support-tools/tree/master/Cognito/decode-verify-jwt
  const jwtDecoded = jwt.decode(token, { complete: true });
  if (!jwtDecoded) {
    throw new Error("unable to decode token");
  }
  const jwk = await getJwkByKid(jwtDecoded.header.kid!);
  if (jwk === null) {
    throw new Error("unable to validate token");
  }
  const pem = jwkToPem(jwk);
  await jwt.verify(token, pem, { algorithms: ['RS256'] });
  return jwtDecoded.payload;
}
