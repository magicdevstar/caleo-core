import EmptyContent from "src/components/empty-content"

export const NotSkilled = () => (
  <EmptyContent
    filled
    title='You do not have the required skills.'
    description='You must have the required skills to create a submission for this incident.'
    sx={{ py: 3 }}
  />
)