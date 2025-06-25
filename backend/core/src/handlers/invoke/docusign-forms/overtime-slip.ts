import ds, {
  Document,
  EnvelopeDefinition,
} from 'docusign-esign';
import { readFileSync } from "fs";
import { PDFDocument } from "pdf-lib";
import { createContext } from "../../../utils/createContext";
import logger from "../../../utils/logger";
import { IIncidentInput, IGenerateFormResponse } from "../../../types/incidentForm";
import { ObjectId } from 'mongodb';
import { IOrganization } from '../../../models/organizations/organization.entity';

export const OvertimeForm = async (event: IIncidentInput) => {
  const context = await createContext();

  const loadDoc = (path: string) => {
    const pdfBytes = readFileSync(path);
    return PDFDocument.load(pdfBytes);
  };

  const fillForm = (pdfDoc: PDFDocument) => {
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

    return pdfDoc;
  };

  const overtimeSlipFormGen = async () => {
    const path = event.isReserve ?
      `${__dirname}/../../../assets/ShiftCloseReserve.pdf` :
      `${__dirname}/../../../assets/ShiftClose.pdf`;
    const pdfDoc = await loadDoc(path);
    return fillForm(pdfDoc).save();
  };

  const overtimeFormDocusign = (
    overtimePDFBytes: Uint8Array<ArrayBufferLike>,
    officerId: string,
    reviewerId: string
  ) => {
    const document = new Document() as unknown as Document;
    document.documentBase64 = Buffer.from(overtimePDFBytes).toString('base64');
    document.name = 'overtime-form';
    document.fileExtension = 'pdf';
    document.documentId = '1';

    const signHere = (ds as any).SignHere.constructFromObject({
      anchorString: '{OTOSign}',
      documentId: document.documentId,
      recipientId: officerId,
      tabLabel: 'officerSignature',
    });
    const dateSigned = (ds as any).DateSigned.constructFromObject({
      anchorString: '{OTODate}',
      documentId: document.documentId,
      recipientId: officerId,
      fontColor: 'Black',
    });

    const reviewerSignHere = (ds as any).SignHere.constructFromObject({
      anchorString: '{OTRSign}',
      documentId: document.documentId,
      recipientId: reviewerId,
      tabLabel: 'reviewerSignature',
    });
    const reviewerInitialHere = (ds as any).InitialHere.constructFromObject({
      anchorString: '{OTRIn}',
      documentId: document.documentId,
      recipientId: reviewerId,
      tabLabel: 'reviewerInitial',
    });
    const supervisorInitialHere = (ds as any).InitialHere.constructFromObject({
      anchorString: '{OTSIn}',
      documentId: document.documentId,
      recipientId: reviewerId,
      tabLabel: 'supervisorInitial',
    });
    const reviewerDateSigned = (ds as any).DateSigned.constructFromObject({
      anchorString: '{OTRDate}',
      documentId: document.documentId,
      recipientId: reviewerId,
      fontColor: 'Black',
    });

    return {
      document,
      officerTabs: {
        signHereTabs: [signHere],
        dateSignedTabs: [dateSigned],
        initialHereTabs: [],
      },
      reviewerTabs: {
        signHereTabs: [reviewerSignHere],
        dateSignedTabs: [reviewerDateSigned],
        initialHereTabs: [
          reviewerInitialHere,
          ...(event.isReserve ? [supervisorInitialHere] : []),
        ],
      },
    };
  };

  const submitToDocusign = async ({
    overtimePDFBytes,
  }:{
    overtimePDFBytes: Uint8Array<ArrayBufferLike>;
  }): Promise<IGenerateFormResponse> => {
    try {
      const {
        tokenRecord,
        envAPI: envelopesApi
      } = await context.docusignModel.initDocusignEnvelopeAPI({
        org: {_id: new ObjectId(event.org.id)} as unknown as IOrganization,
      });
  
      const clientUserId = '1001';
      const officer = (ds as any).Signer.constructFromObject({
        email: event.user.member.contactInfo!.primaryEmail.address!,
        name: `${event.user.firstName} ${event.user.lastName}`,
        recipientId: '1',
        routingOrder: '1',
        clientUserId,
      });
      const reviewerSigner = (ds as any).Signer.constructFromObject({
        email: event.reviewer.email,
        name: event.reviewer.name,
        recipientId: '2',
        routingOrder: '2',
      });
      const {
        document: overtimeDocument,
        officerTabs: overtimeOfficerTabs,
        reviewerTabs: overtimeReviewerTabs
      } = overtimeFormDocusign(overtimePDFBytes, officer.recipientId, reviewerSigner.recipientId);
      
      officer.tabs = (ds as any).Tabs.constructFromObject({
        signHereTabs: [
          ...overtimeOfficerTabs.signHereTabs,
        ],
        dateSignedTabs: [
          ...overtimeOfficerTabs.dateSignedTabs
        ],
        initialHereTabs: [
          ...overtimeOfficerTabs.initialHereTabs
        ]
      });
  
      reviewerSigner.tabs = (ds as any).Tabs.constructFromObject({
        signHereTabs: [
          ...overtimeReviewerTabs.signHereTabs,
        ],
        dateSignedTabs: [
          ...overtimeReviewerTabs.dateSignedTabs,
        ],
      });
  
      const envelopeDefinition: EnvelopeDefinition = new (ds as any).EnvelopeDefinition();
      envelopeDefinition.emailSubject = `Overtime Worked Report - ${event.incidentFormDetails.eventName} - ${event.user.lastName}, ${event.user.firstName}`;
      envelopeDefinition.documents = [overtimeDocument];
      envelopeDefinition.recipients = (ds as any).Recipients.constructFromObject({
        signers: [officer, reviewerSigner],
      });
      envelopeDefinition.status = 'sent';
      envelopeDefinition.customFields = {
        textCustomFields: [
          {
            name: "entityType",
            value: event.entityType,
            show: "false"
          },
          {
            name: "entityId",
            value: event.entityId,
            show: "false"
          },
          {
            name: "orgId",
            value: event.org.id,
            show: "false"
          },
          {
            name: "formType",
            value: event.type.toString(),
            show: "false"
          },
          {
            name: 'userId',
            value: event.user.id,
            show: "false"
          },
        ]
      };
  
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
  };

  const submitForm = async () => {
    const overtimePDFBytes = await overtimeSlipFormGen();

    return submitToDocusign({
      overtimePDFBytes,
    });
  }

  return {
    submitForm,
  };
};
