variable "user_pool_name" {
  type        = string
  description = "Name of the Cognito User Pool"
}

variable "client_name" {
  type        = string
  description = "Name of the Cognito User Pool Client"
}

variable "callback_urls" {
  type        = list(string)
  description = "List of allowed callback URLs"
}

variable "logout_urls" {
  type        = list(string)
  description = "List of allowed logout URLs"
}

variable "cognito_domain" {
  type        = string
  description = "Domain prefix for Cognito hosted UI"
}

variable "from_email" {
  type        = string
  description = "SES verified email address to send from"
}

variable "sso_configurations" {
  type = map(object({
    metadata_url      = string
    attribute_mapping = map(string)
  }))
  description = "Map of SSO configurations"
  default     = {}
}

variable "stage" {
  type        = string
  description = "Environment stage (e.g., dev, prod)"
}

variable "installHooks" {
  type        = bool
  description = "Flag to install lambda hooks"
  default     = false
}
