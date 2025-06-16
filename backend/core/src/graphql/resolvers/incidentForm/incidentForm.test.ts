import {
  describe,
  it,
  beforeAll,
  afterAll,
  jest,
} from '@jest/globals';
import { testingService } from '../../../services/testing/testing.service';

// Mock the Docusign class
jest.mock('./../../../services/docusign.service', () => {
  return {
    Docusign: jest.fn().mockImplementation(() => {
      return {
        submitIncidentForm: () => Promise.resolve({
          envelopeId: 'mock-envelope-id-12345',
          signingUrl: 'http://mock-signing-url.com',
        }),
      };
    }),
  };
});

// Using it.only inside the describe block is more reliable than describe.only
describe('Incident Form', () => {
  beforeAll(async () => {
    await testingService.init();
  });
  
  afterAll(async () => await testingService.afterAll());

  it('should create form submission', async () => {
    if (!testingService.testingDefault) {
      throw new Error('testingDefault not initialized');
    }
    const input = {
      "id": "663c2f2f8e4b7a001e4f1234",
      "operationalPeriod": {
        "date": "2025-06-12"
      },
      "reviewer": "John Doe",
      "timekeeping": {
        "rdo": "no",
        "straightHours": 8.0,
        "timeIn": "2025-06-12T08:00:00Z",
        "timeOut": "2025-06-12T16:00:00Z"
      },
      "shiftDetails": {
        "enrouteToIncident": "2025-06-12T07:30:00Z",
        "staging1097": "2025-06-12T07:45:00Z",
        "staging1098": "2025-06-12T07:50:00Z",
        "arrivalAtUOA": "2025-06-12T08:10:00Z",
        "time18Hour": "2025-06-12T18:00:00Z"
      },
      "vehicleInformation": {
        "hasVehicle": "yes",
        "vehicleCategory": "SUV",
        "vehicleMake": "Ford",
        "vehicleModel": "Explorer",
        "vehicleNumber": "F1234",
        "startingMileage": 12000.5,
        "endingMileage": 12125.7
      },
      "assignmentSummary": {
        "callSign": "Alpha-1",
        "squad": "Bravo",
        "supervisor": "Captain Smith",
        "missionAssignments": {
          "escort": true,
          "evacuations": false,
          "hardClosure": false,
          "incidentManagementTeam": false,
          "logistics": false,
          "rrf": false,
          "rovingSecurity": false,
          "searchAndRescue": false,
          "softClosure": false,
          "welfareCheck": false,
          "other": false
        }
      },
      "activityLog": {
        "entries": [
          {
            "time": "2025-06-12T09:00:00Z",
            "missionNumber": "M123",
            "notes": "Initial sweep of affected area completed."
          },
          {
            "time": "2025-06-12T12:30:00Z",
            "missionNumber": "M124",
            "notes": "Transported civilians to shelter."
          }
        ]
      },
      "eventId": "663c2f2f8e4b7a001e4f5678"
    };
    await testingService.submitIncidentForm(input);
  });
});
