export interface DocusignEvent {
  event: string
  apiVersion: string
  uri: string
  retryCount: number
  configurationId: number
  generatedDateTime: string
  data: Data
}

export interface Data {
  accountId: string
  userId: string
  envelopeId: string
  envelopeSummary: EnvelopeSummary
}

export interface EnvelopeSummary {
  status: string
  documentsUri: string
  recipientsUri: string
  attachmentsUri: string
  envelopeUri: string
  emailSubject: string
  envelopeId: string
  signingLocation: string
  customFieldsUri: string
  notificationUri: string
  enableWetSign: string
  allowMarkup: string
  allowReassign: string
  createdDateTime: string
  lastModifiedDateTime: string
  deliveredDateTime: string
  initialSentDateTime: string
  sentDateTime: string
  completedDateTime: string
  statusChangedDateTime: string
  documentsCombinedUri: string
  certificateUri: string
  templatesUri: string
  expireEnabled: string
  expireDateTime: string
  expireAfter: string
  sender: Sender
  customFields: CustomFields
  recipients: Recipients
  envelopeDocuments: EnvelopeDocument[]
  purgeState: string
  envelopeIdStamping: string
  is21CFRPart11: string
  signerCanSignOnMobile: string
  autoNavigation: string
  isSignatureProviderEnvelope: string
  hasFormDataChanged: string
  allowComments: string
  hasComments: string
  allowViewHistory: string
  envelopeMetadata: EnvelopeMetadata
  anySigner: any
  envelopeLocation: string
  isDynamicEnvelope: string
  burnDefaultTabData: string
}

export interface Sender {
  userName: string
  userId: string
  accountId: string
  email: string
  ipAddress: string
}

export interface CustomFields {
  textCustomFields: TextCustomField[]
  listCustomFields: any[]
}

export interface TextCustomField {
  fieldId: string
  name: string
  show: string
  required: string
  value: string
}

export interface Recipients {
  signers: Signer[]
  agents: any[]
  editors: any[]
  intermediaries: any[]
  carbonCopies: any[]
  certifiedDeliveries: any[]
  inPersonSigners: any[]
  seals: any[]
  witnesses: any[]
  notaries: any[]
  recipientCount: string
  currentRoutingOrder: string
}

export interface Signer {
  tabs: Tabs
  creationReason: string
  isBulkRecipient: string
  requireUploadSignature: string
  name: string
  firstName: string
  lastName: string
  email: string
  recipientId: string
  recipientIdGuid: string
  requireIdLookup: string
  userId: string
  routingOrder: string
  note: string
  roleName: string
  status: string
  completedCount: string
  signedDateTime: string
  deliveredDateTime: string
  sentDateTime: string
  deliveryMethod: string
  totalTabCount: string
  recipientType: string
}

export interface Tabs {
  signHereTabs: SignHereTab[]
  dateSignedTabs: DateSignedTab[]
  textTabs?: TextTab[]
  numberTabs: NumberTab[]
  radioGroupTabs?: RadioGroupTab[]
}

export interface SignHereTab {
  stampType: string
  name: string
  tabLabel: string
  scaleValue: string
  optional: string
  documentId: string
  recipientId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  tabId: string
  templateRequired: string
  status: string
  tabType: string
  agreementAttributeLocked: string
}

export interface DateSignedTab {
  name: string
  value: string
  tabLabel: string
  font: string
  fontColor: string
  fontSize: string
  localePolicy: LocalePolicy
  documentId: string
  recipientId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  width: string
  height: string
  tabId: string
  templateRequired: string
  tabType: string
  agreementAttributeLocked: string
}

export interface LocalePolicy {}

export interface TextTab {
  validationPattern: string
  validationMessage: string
  shared: string
  requireInitialOnSharedChange: string
  requireAll: string
  value: string
  required: string
  locked: string
  concealValueOnDocument: string
  disableAutoSize: string
  maxLength: string
  tabLabel: string
  font: string
  fontColor: string
  fontSize: string
  localePolicy: LocalePolicy2
  documentId: string
  recipientId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  width: string
  height: string
  tabId: string
  templateRequired: string
  tabType: string
  agreementAttributeLocked: string
  conditionalParentLabel?: string
  conditionalParentValue?: string
}

export interface LocalePolicy2 {}

export interface NumberTab {
  validationPattern: string
  validationMessage: string
  shared: string
  requireInitialOnSharedChange: string
  requireAll: string
  value: string
  required: string
  locked: string
  concealValueOnDocument: string
  disableAutoSize: string
  maxLength: string
  tabLabel: string
  font: string
  fontColor: string
  fontSize: string
  localePolicy: LocalePolicy3
  documentId: string
  recipientId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  width: string
  height: string
  tabId: string
  templateRequired: string
  conditionalParentLabel?: string
  conditionalParentValue?: string
  tabType: string
  agreementAttributeLocked: string
}

export interface LocalePolicy3 {}

export interface RadioGroupTab {
  documentId: string
  recipientId: string
  templateRequired: string
  groupName: string
  radios: Radio[]
  shared: string
  requireInitialOnSharedChange: string
  requireAll: string
  tabType: string
  value: string
  originalValue: string
}

export interface Radio {
  pageNumber: string
  xPosition: string
  yPosition: string
  value: string
  selected: string
  tabId: string
  required: string
  locked: string
  font: string
  bold: string
  italic: string
  underline: string
  fontColor: string
  fontSize: string
}

export interface EnvelopeDocument {
  documentId: string
  documentIdGuid: string
  name: string
  type: string
  uri: string
  order: string
  pages?: Page[]
  display: string
  includeInDownload: string
  signerMustAcknowledge: string
  templateRequired: string
  authoritativeCopy: string
  tabs?: Tabs2
}

export interface Page {
  pageId: string
  sequence: string
  height: string
  width: string
  dpi: string
}

export interface Tabs2 {
  prefillTabs: PrefillTabs
}

export interface PrefillTabs {
  textTabs: TextTab2[]
  dateTabs: DateTab[]
}

export interface TextTab2 {
  validationPattern: string
  validationMessage: string
  shared: string
  requireAll: string
  value: string
  originalValue: string
  required: string
  locked: string
  concealValueOnDocument: string
  disableAutoSize: string
  maxLength: string
  tabLabel: string
  font: string
  bold: string
  italic: string
  underline: string
  fontColor: string
  fontSize: string
  localePolicy: LocalePolicy4
  documentId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  width: string
  height: string
  tabId: string
  templateRequired: string
  tabType: string
  agreementAttributeLocked: string
}

export interface LocalePolicy4 {}

export interface DateTab {
  validationPattern: string
  validationMessage: string
  shared: string
  requireAll: string
  value: string
  originalValue: string
  required: string
  locked: string
  concealValueOnDocument: string
  disableAutoSize: string
  maxLength: string
  tabLabel: string
  font: string
  bold: string
  italic: string
  underline: string
  fontColor: string
  fontSize: string
  localePolicy: LocalePolicy5
  documentId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  width: string
  height: string
  tabId: string
  templateRequired: string
  tabType: string
  agreementAttributeLocked: string
}

export interface LocalePolicy5 {}

export interface EnvelopeMetadata {
  allowAdvancedCorrect: string
  enableSignWithNotary: string
  allowCorrect: string
}
