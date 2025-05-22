import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { testingService } from "../../../services/testing/testing.service";

describe('Unit', () => {
  beforeAll(async () => {
    await testingService.init();
  });
  
  afterAll(async () => await testingService.afterAll());

  it('Create unit with 2 divisions and remove one division', async () => {
    const division1 = await testingService.createDivision();
    const division2 = await testingService.createDivision();

    const unitWithDivisions = await testingService.createUnit({
      divisionIds: [division1.id, division2.id],
    });

    expect(unitWithDivisions).toBeDefined();
    expect(unitWithDivisions.divisions).toHaveLength(2);
    expect(unitWithDivisions.divisions?.[0]?.id).toEqual(division1.id);
    expect(unitWithDivisions.divisions?.[1]?.id).toEqual(division2.id);

    await testingService.removeDivision(division1.id);

    const updatedUnit = await testingService.getUnit(unitWithDivisions.id);

    expect(updatedUnit).toBeDefined();
    expect(updatedUnit.divisions).toHaveLength(1);
    expect(updatedUnit.divisions?.[0]?.id).toEqual(division2.id);
  });
});
