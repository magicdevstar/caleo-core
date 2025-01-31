variable "user_pool_id" {
  type = string
  description = "The ID of the user pool to associate the identity provider with."
}

variable "provider_name" {
  type = string
  description = "The name of the identity provider."
}

variable "metadata_url" {
  type = string
  description = "The URL of the SAML metadata document."
}

variable "email_attribute" {
  type = string
  description = "The attribute in the SAML response that contains the user's email address."
}

variable "family_name_attribute" {
  type = string
  description = "The attribute in the SAML response that contains the user's family name."
}

variable "given_name_attribute" {
  type = string
  description = "The attribute in the SAML response that contains the user's given name."
}

variable "phone_number_attribute" {
  type = string
  description = "The attribute in the SAML response that contains the user's phone number."
}

