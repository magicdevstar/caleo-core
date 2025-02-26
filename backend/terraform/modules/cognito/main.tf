data "aws_ses_email_identity" "from_email" {
  email = var.from_email
}

resource "aws_cognito_user_pool" "pool" {
  name = var.user_pool_name

  auto_verified_attributes = ["email"]
  username_attributes      = ["email"]
  
  mfa_configuration = "OFF"

  schema {
    attribute_data_type = "String"
    name                = "approved"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "impersonation"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "org_id"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "p_number"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type = "String"
    name                = "legacy_sub"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  email_configuration {
    source_arn            = data.aws_ses_email_identity.from_email.arn
    email_sending_account = "DEVELOPER"
    from_email_address    = "support@${data.aws_ses_email_identity.from_email.email}"
  }
}

resource "aws_cognito_identity_provider" "provider" {
  for_each      = var.sso_configurations
  user_pool_id  = aws_cognito_user_pool.pool.id
  provider_name = each.key
  provider_type = "SAML"

  provider_details = {
    IDPInit                 = false
    IDPSignout              = false
    EncryptedResponses      = false
    MetadataURL             = each.value.metadata_url
    RequestSigningAlgorithm = "rsa-sha256"
  }

  attribute_mapping = {
    email        = each.value.email_attribute
    family_name  = each.value.family_name_attribute
    given_name   = each.value.given_name_attribute
    phone_number = each.value.phone_number_attribute
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = var.client_name
  user_pool_id = aws_cognito_user_pool.pool.id

  allowed_oauth_flows                  = ["code"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_scopes                 = ["email", "openid", "phone", "profile"]

  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  refresh_token_validity = 30

  supported_identity_providers = concat(
    ["COGNITO"],
    [for provider_name, _ in var.sso_configurations : provider_name]
  )

  generate_secret = false
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain
  user_pool_id = aws_cognito_user_pool.pool.id
}
