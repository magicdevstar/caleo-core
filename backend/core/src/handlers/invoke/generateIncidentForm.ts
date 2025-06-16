import ds, {
  Document,
} from 'docusign-esign';
import { readFileSync } from "fs";
import { PDFDocument } from "pdf-lib";
import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import { createContext, IServiceContext } from "../../utils/createContext";
import logger from "../../utils/logger";
import { IIncidentInput, IIncidentResponse } from "../../types/incidentForm";
import { ObjectId } from 'mongodb';
import { IOrganization } from '../../models/organizations/organization.entity';

const generateIncidentForm = async (event: IIncidentInput): Promise<IIncidentResponse> => {
  try {
    const context = await createContext();
    const pdfBytes = readFileSync(`${__dirname}/../../../assets/ActivityLog.pdf`);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Remove second page if totalActivities is less than or equal to 4
    if (event.totalActivities <= 4) {
      pdfDoc.removePage(1);
    }
    
    // Get the form from the PDF
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    for (const field of fields) {
      const fieldName = field.getName();
      if(!event.incidentFormDetails[fieldName]) {
        continue;
      }
      const fieldType = field.constructor.name;
      
      try {
        // Handle different field types
        if (/PDFTextField/.test(fieldType)) {
          const textField = form.getTextField(fieldName);
          textField.setText(event.incidentFormDetails[fieldName]);
        } else if (/PDFCheckBox/.test(fieldType)) {
          const checkBox = form.getCheckBox(fieldName);
          const value = !!event.incidentFormDetails[fieldName];
          if (value) {
            checkBox.check();
          } else {
            checkBox.uncheck();
          }
        } else {
          logger.warn(`Unsupported field type: ${fieldType}`, { fieldName, fieldType });
        }
      } catch (error) {
        logger.error(`Error setting field`, { fieldName, error });
      }
    }

    const finalBytes = await pdfDoc.save();

    return submitToDocusgin({
      pdfBytes: finalBytes,
      event,
      context,
    });
  } catch(error) {
    logger.error("Error generating incident form", { error });
    throw error;
  }
};

const submitToDocusgin = async ({
  pdfBytes,
  event,
  context,
}:{
  context: IServiceContext;
  event: IIncidentInput;
  pdfBytes: Uint8Array<ArrayBufferLike>;
}): Promise<IIncidentResponse> => {
  try {
    const {
      tokenRecord,
      envAPI: envelopesApi
    } = await context.docusignModel.initDocusignEnvelopeAPI({
      org: {_id: new ObjectId(event.org.id)} as unknown as IOrganization,
    });

    const document = new Document() as unknown as Document;
    document.documentBase64 = Buffer.from(pdfBytes).toString('base64');
    document.name = 'auto-filled-form';
    document.fileExtension = 'pdf';
    document.documentId = '1';

    const clientUserId = '1001';

    const officer = (ds as any).Signer.constructFromObject({
      email: event.user.member.contactInfo?.primaryEmail.address!,
      name: `${event.user.firstName} ${event.user.lastName}`,
      recipientId: '1',
      routingOrder: '1',
      clientUserId,
    });
    const signHere = (ds as any).SignHere.constructFromObject({
      anchorString: event.totalActivities > 4 ? '{officerSignature2}' : '{officerSignature}',
      documentId: '1',
      recipientId: '1',
      tabLabel: 'officerSignature',
    });
    const dateSigned = (ds as any).DateSigned.constructFromObject({
      anchorString: event.totalActivities > 4 ? '{officerSigningDate2}' : '{officerSigningDate}',
      documentId: '1',
      recipientId: '1',
      fontColor: 'Black',
    });
    officer.tabs = (ds as any).Tabs.constructFromObject({
      signHereTabs: [signHere],
      dateSignedTabs: [dateSigned],
    });

    const reviewerSigner = (ds as any).Signer.constructFromObject({
      email: event.reviewer.email,
      name: event.reviewer.name,
      recipientId: '2',
      routingOrder: '2',
      clientUserId,
    });
    const reviewerSignHere = (ds as any).SignHere.constructFromObject({
      anchorString: event.totalActivities > 4 ? '{reviewerSignature2}' : '{reviewerSignature}',
      documentId: '2',
      recipientId: '2',
      tabLabel: 'reviewerSignature',
    });
    const reviewerDateSigned = (ds as any).DateSigned.constructFromObject({
      anchorString: event.totalActivities > 4 ? '{reviewerSigningDate2}' : '{reviewerSigningDate}',
      documentId: '2',
      recipientId: '2',
      fontColor: 'Black',
    });
    reviewerSigner.tabs = (ds as any).Tabs.constructFromObject({
      signHereTabs: [reviewerSignHere],
      dateSignedTabs: [reviewerDateSigned],
    });

    const envelopeDefinition = new (ds as any).EnvelopeDefinition();
    envelopeDefinition.emailSubject = `Incident Form Submission: ${event.incidentFormDetails.eventName} - ${event.user.lastName}, ${event.user.firstName}`;
    envelopeDefinition.documents = [document];
    envelopeDefinition.recipients = (ds as any).Recipients.constructFromObject({
      signers: [officer, reviewerSigner],
    });
    envelopeDefinition.status = 'sent';

    const envelope = await envelopesApi.createEnvelope(tokenRecord.accountId, {
      envelopeDefinition,
    });

    const domain = event.org.sso?.uiSubDomains?.[0];
    const baseDomain = `https://${domain}.caleopro.com`;
    // const baseDomain = 'http://192.168.4.150:3000';
    const viewRequest = {
      returnUrl: `${baseDomain}/dashboard`,
      authenticationMethod: 'none',
      email: event.user.member.contactInfo?.primaryEmail.address,
      userName: event.user.name,
      clientUserId,
      frameAncestors: [baseDomain],
      messageOrigins: [baseDomain]
    };
    const recipientView = await envelopesApi.createRecipientView(tokenRecord.accountId, envelope.envelopeId!, { recipientViewRequest: viewRequest });
    const signingUrl = recipientView.url!;

    return {
      envelopeId: envelope.envelopeId!,
      signingUrl,
    };
  } catch(error) {
    console.log(error);
    throw new Error("Error submitting to DocuSign");
  }
}

export const handler = middy(generateIncidentForm)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
