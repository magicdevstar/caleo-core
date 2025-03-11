import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import { APIGatewayEvent } from "aws-lambda";
import crypto from 'crypto';
import logger from "../../../utils/logger";
import { createContext } from "../../../utils/createContext";
import { DocusignEvent } from "../../../types/docusign";

const findAttributeValue = (key: string) => (webhookData: DocusignEvent) => {
  const textCustomFields = webhookData.data.envelopeSummary.customFields.textCustomFields;
  return textCustomFields?.find((field) => field.name === key)?.value;
};

const findOrgId = findAttributeValue('orgId');
const findShiftId = findAttributeValue('shiftId');

export const docusignEvent = async (event: APIGatewayEvent) => {
  try {
    const webhookData = JSON.parse(event.body || '{}') as DocusignEvent;
    const orgId = findOrgId(webhookData);
    const shiftId = findShiftId(webhookData);

    if (!orgId) {
      throw new Error('Organization ID not found in webhook data');
    }
    if (!shiftId) {
      throw new Error('Organization ID not found in webhook data');
    }

    const services = await createContext();
    const org = await services.organizations.get(orgId);
    if (!org || !org.docusign.hmac) {
      throw new Error('Organization not found');
    }
    const hmac = org.docusign.hmac;
    
    // Get the signature from headers
    const signature = event.headers['x-docusign-signature-1'];
    if (!signature) {
      throw new Error('Missing DocuSign signature');
    }

    // Verify HMAC
    const computedSignature = crypto
      .createHmac('sha256', hmac)
      .update(event.body || '')
      .digest('base64');

    if (signature !== computedSignature) {
      logger.error('Invalid DocuSign signature');
      return {
        statusCode: 401,
        body: JSON.stringify({
          message: 'Invalid signature',
        }),
      };
    }

    logger.info('Webhook details', { shiftId, orgId });

    await services.docusign.saveEvent({
      shiftId,
      status: webhookData.data.envelopeSummary.status,
      envelopeId: webhookData.data.envelopeId,
      signers: webhookData.data.envelopeSummary.recipients.signers,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Webhook received successfully',
      }),
    };
  } catch (error) {
    logger.error('Failed to handle docusign hook', { error });
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Failed to handle docusign hook',
      }),
    };
  }
}

export const handler = middy(docusignEvent)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
