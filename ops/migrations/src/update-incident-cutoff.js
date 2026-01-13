// Run in the mongodb shell
db.events.updateMany(
  {
    status: 'INCIDENT',
    removedAt: { $exists: false }
  },
  [
    {
      $set: {
        incidentSubmissionCuttoff: '$endTime',
        updatedAt: new Date()
      }
    }
  ]
)
