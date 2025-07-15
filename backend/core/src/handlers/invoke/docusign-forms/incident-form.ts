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

export const IncidentForm = async (event: IIncidentInput) => {
  const context = await createContext();

  const loadDoc = (path: string) => {
    const pdfBytes = readFileSync(path);
    return PDFDocument.load(pdfBytes);
  }

  const fillForm = (pdfDoc: PDFDocument) => {
    // Get the form from the PDF
    const form = pdfDoc.getForm();
    const fields = form.getFields();
  
    for (const field of fields) {
      const fieldName = field.getName();

      if (
        fieldName === 'otherExplanation' &&
        (!event.incidentFormDetails.other || event.incidentFormDetails.otherExplanation.trim() === '')
      ) {
        logger.info('Removing "otherExplanation" field as "other" is not selected', { fieldName });
        form.removeField(field);
        continue;
      }

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
  }

  const incidentFormGen = async () => {
    const pdfDoc = await loadDoc(`${__dirname}/../../../assets/ActivityLog.pdf`);
    return fillForm(pdfDoc).save();
  };

  const overtimeSlipFormGen = async () => {
    const path = event.isReserve ?
      `${__dirname}/../../../assets/ShiftCloseReserve.pdf` :
      `${__dirname}/../../../assets/ShiftClose.pdf`;
    const pdfDoc = await loadDoc(path);
    return fillForm(pdfDoc).save();
  };

  const incidentFormDocusign = (
    incidentPDFBytes: Uint8Array<ArrayBufferLike>,
    officerId: string,
    reviewerId: string
  ) => {
    const document = new Document() as unknown as Document;
    document.documentBase64 = Buffer.from(incidentPDFBytes).toString('base64');
    document.name = 'incident-214-form';
    document.fileExtension = 'pdf';
    document.documentId = '1';

    const signHere = (ds as any).SignHere.constructFromObject({
      anchorString: '{officerSignature}',
      documentId: document.documentId,
      recipientId: officerId,
      tabLabel: 'officerSignature',
    });
    const signHerePage2 = (ds as any).SignHere.constructFromObject({
      anchorString: '{officerSignature2}',
      documentId: document.documentId,
      recipientId: officerId,
      tabLabel: 'officerSignaturePage2',
    });
    const dateSigned = (ds as any).DateSigned.constructFromObject({
      anchorString: '{officerSigningDate}',
      documentId: document.documentId,
      recipientId: officerId,
      fontColor: 'Black',
      font: 'Arial',
      fontSize: 'size10',
      anchorUnits: 'pixels',
      anchorYOffset: '-2',
    });
    const dateSignedPage2 = (ds as any).DateSigned.constructFromObject({
      anchorString: '{officerSigningDate2}',
      documentId: document.documentId,
      recipientId: officerId,
      fontColor: 'Black',
      font: 'Arial',
      fontSize: 'size10',
      anchorUnits: 'pixels',
      anchorYOffset: '-2',
    });

    const reviewerSignHere = (ds as any).SignHere.constructFromObject({
      anchorString: '{reviewerSignature}',
      documentId: document.documentId,
      recipientId: reviewerId,
      tabLabel: 'reviewerSignature',
    });
    const reviewerSignHerePage2 = (ds as any).SignHere.constructFromObject({
      anchorString: '{reviewerSignature2}',
      documentId: document.documentId,
      recipientId: reviewerId,
      tabLabel: 'reviewerSignaturePage2',
    });
    const reviewerDateSigned = (ds as any).DateSigned.constructFromObject({
      anchorString: '{reviewerSigningDate}',
      documentId: document.documentId,
      recipientId: reviewerId,
      fontColor: 'Black',
      font: 'Arial',
      fontSize: 'size10',
      anchorUnits: 'pixels',
      anchorYOffset: '-2',
    });
    const reviewerDateSignedPage2 = (ds as any).DateSigned.constructFromObject({
      anchorString: '{reviewerSigningDate2}',
      documentId: document.documentId,
      recipientId: reviewerId,
      fontColor: 'Black',
      font: 'Arial',
      fontSize: 'size10',
      anchorUnits: 'pixels',
      anchorYOffset: '-2',
    });

    return {
      document,
      officerTabs: {
        signHereTabs: [signHere, signHerePage2],
        dateSignedTabs: [dateSigned, dateSignedPage2],
        initialHereTabs: [],
      },
      reviewerTabs: {
        signHereTabs: [reviewerSignHere, reviewerSignHerePage2],
        dateSignedTabs: [reviewerDateSigned, reviewerDateSignedPage2],
        initialHereTabs: [],
      },
    };
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
    document.documentId = '2';

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
      font: 'Arial',
      anchorUnits: 'pixels',
      anchorXOffset: '-10',
      fontSize: 'size10',
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
      font: 'Arial',
      fontSize: 'size10',
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

  const submitToDocusgin = async ({
    incidentPDFBytes,
    overtimePDFBytes,
  }:{
    incidentPDFBytes: Uint8Array<ArrayBufferLike>;
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
        document: incidentDocument,
        officerTabs: incidentOfficerTabs,
        reviewerTabs: incidentReviewerTabs
      } = incidentFormDocusign(incidentPDFBytes, officer.recipientId, reviewerSigner.recipientId);
      const {
        document: overtimeDocument,
        officerTabs: overtimeOfficerTabs,
        reviewerTabs: overtimeReviewerTabs
      } = overtimeFormDocusign(overtimePDFBytes, officer.recipientId, reviewerSigner.recipientId);
      
      officer.tabs = (ds as any).Tabs.constructFromObject({
        signHereTabs: [
          ...incidentOfficerTabs.signHereTabs,
          ...overtimeOfficerTabs.signHereTabs,
        ],
        dateSignedTabs: [
          ...incidentOfficerTabs.dateSignedTabs,
          ...overtimeOfficerTabs.dateSignedTabs
        ],
        initialHereTabs: [
          ...incidentOfficerTabs.initialHereTabs,
          ...overtimeOfficerTabs.initialHereTabs
        ]
      });
  
      reviewerSigner.tabs = (ds as any).Tabs.constructFromObject({
        signHereTabs: [
          ...incidentReviewerTabs.signHereTabs,
          ...overtimeReviewerTabs.signHereTabs,
        ],
        dateSignedTabs: [
          ...incidentReviewerTabs.dateSignedTabs,
          ...overtimeReviewerTabs.dateSignedTabs,
        ],
        initialHereTabs: [
          ...incidentReviewerTabs.initialHereTabs,
          ...incidentReviewerTabs.initialHereTabs
        ]
      });
  
      const envelopeDefinition: EnvelopeDefinition = new (ds as any).EnvelopeDefinition();
      envelopeDefinition.emailSubject = `Incident Form Submission: ${event.incidentFormDetails.eventName} - ${event.user.lastName}, ${event.user.firstName}`;
      envelopeDefinition.documents = [incidentDocument, overtimeDocument];
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
          {
            name: 'incidentFormId',
            value: event.incidentFormId,
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
    const incidentPDFBytes = await incidentFormGen();
    const overtimePDFBytes = await overtimeSlipFormGen();

    return submitToDocusgin({
      incidentPDFBytes,
      overtimePDFBytes,
    });
  }

  return {
    submitForm,
  };
};
