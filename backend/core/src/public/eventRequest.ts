import { Event, Venue, VenueStatus } from "../__generated__/resolvers-types";
import { MailerEvents } from "../types/mailer";
import { createContext } from "../utils/createContext";
import logger from "../utils/logger";
import { APIGatewayEvent } from "aws-lambda";

export const handler = async (inputEvent: APIGatewayEvent) => {
  try {
    const context = await createContext();
    const { body } = inputEvent;
    const {
      event,
      venue,
      orgId,
    } = JSON.parse(body || '{}');
    if (!orgId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing orgId',
        }),
      };
    }
    const organization = await context.organizations.get(orgId);
    if (!organization?.features?.externalEventRequests) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'This org does not allow external requests',
        }),
      };
    }

    let venueId = event.venueId;
    if (!venueId) {
      venue.orgId = orgId;
      venue.status = VenueStatus.Requested;
      const finalVenue: Venue = await context.venues.create(venue);
      venueId = finalVenue.id;
    }

    event.orgId = orgId;
    event.referenceId = await context.eventReferenceNumber.get(orgId);
    event.searchAttribute = `${event.referenceId} ${event.name}`;
    event.venueId = venueId;
    const finalEvent: Event = await context.events.create(event);

    Promise.all([
      await context.events.sendEventRequestMailerEvent({
        event: finalEvent,
        venueId,
        orgId,
        template: MailerEvents.EventRequestedConfirm,
      }),
      await context.events.sendEventRequestMailerEvent({
        event: finalEvent,
        venueId,
        orgId,
        template: MailerEvents.AdminEventRequested,
      })
    ]);
    
    return {
      event: finalEvent
    };
  } catch (error) {
    logger.error('Failed to create event and venue', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to create event',
      }),
    };
  }
}
