resource "aws_cognito_identity_provider" "provider" {
  user_pool_id  = var.user_pool_id
  provider_name = var.provider_name
  provider_type = "SAML"

  provider_details = {
    IDPInit                 = false
    IDPSignout              = false
    EncryptedResponses      = false
    MetadataURL             = var.metadata_url
    RequestSigningAlgorithm = "rsa-sha256"
  }

  attribute_mapping = {
    email         = var.email_attribute
    family_name   = var.family_name_attribute
    given_name    = var.given_name_attribute
    phone_number  = var.phone_number_attribute
  }
}