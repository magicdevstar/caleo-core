import { injectLambdaContext } from "@aws-lambda-powertools/logger/middleware";
import middy from "@middy/core";
import logger from "../../utils/logger";
import { IIncidentInput, IGenerateFormResponse, IncidentFormType } from "../../types/incidentForm";
import { IncidentForm } from './docusign-forms/incident-form';
import { OvertimeForm } from "./docusign-forms/overtime-slip";

const generateIncidentForm = async (event: IIncidentInput): Promise<IGenerateFormResponse | undefined> => {
  try {
    switch(event.type) {
      case IncidentFormType.LASD_INCIDENT_FORM:
        logger.info('Generating LASD Incident Form', { event });
        const incidentService = await IncidentForm(event);
        const res = await incidentService.submitForm();
        return res;
      case IncidentFormType.LASD_OVERTIME_SLIP:
        logger.info('Generating LASD Incident Form', { event });
        const overtimeService = await OvertimeForm(event);
        const overtimeResponse = await overtimeService.submitForm();
        return overtimeResponse;
      default:
        logger.error('Unknown incident form type', { event, type: event.type });
    }
    return;
  } catch(error) {
    console.log(error);
    logger.error("Error generating incident form", { error });
    throw error;
  }
};

export const handler = middy(generateIncidentForm)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
