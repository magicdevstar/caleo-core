locals {
  amplify_id   = "d1devc1e4gname"
  user_pool_id = "us-west-2_8023dPQwv"

  sso_configurations = {
    "azure" = {
      metadata_url           = "https://login.microsoftonline.com/810fe9e3-a982-4f6b-be51-fd90dafed5aa/federationmetadata/2007-06/federationmetadata.xml?appid=6ce0aa1b-6609-4ba2-a405-470d467768dc"
      email_attribute        = "email"
      family_name_attribute  = "surname"
      given_name_attribute   = "givenname"
      phone_number_attribute = "phone"
    }
    "lasd-dev" = {
      metadata_url           = "https://login.microsoftonline.com/10912896-cd7e-496c-baf0-6a664593a177/federationmetadata/2007-06/federationmetadata.xml?appid=0977712d-b052-41ac-ba4d-6d5367b04e56"
      email_attribute        = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      family_name_attribute  = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
      given_name_attribute   = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
      phone_number_attribute = "user.telephonenumber"
    }
  }

  base_hosted_zones = {
    "dev" = "dev.caleopro.com"
  }

  sso_hosted_zones = {
    for k, _ in local.sso_configurations : k => "${k}.caleopro.com"
  }

  hosted_zones = merge(local.base_hosted_zones, local.sso_hosted_zones)

  cognito_client_urls = concat(
    [
      "http://localhost:3000",
      "https://dev.caleopro.com"
    ],
    [for key in keys(local.sso_configurations) : "https://${key}.caleopro.com"]
  )
}

module "domains" {
  for_each = local.hosted_zones

  source = "../../modules/hosted-zone"

  zone_name = each.value
}

module "amplify_domains" {
  source  = "../../modules/amplify-domain"
  app_id  = local.amplify_id
  domains = local.hosted_zones
}

module "cognito_providers" {
  for_each = local.sso_configurations

  source = "../../modules/cognito_provider"

  user_pool_id           = local.user_pool_id
  provider_name          = each.key
  metadata_url           = each.value.metadata_url
  email_attribute        = each.value.email_attribute
  family_name_attribute  = each.value.family_name_attribute
  given_name_attribute   = each.value.given_name_attribute
  phone_number_attribute = each.value.phone_number_attribute
}

module "cognito" {
  source = "../../modules/cognito"

  user_pool_name = "caleo-dev"
  client_name    = "caleo-dev"
  callback_urls = [
    "http://localhost:3000",
    "https://dev.caleopro.com"
  ]
  logout_urls = [
    "http://localhost:3000",
    "https://dev.caleopro.com"
  ]
  cognito_domain     = "caleo-pro-dev"
  from_email         = "dev.caleopro.com"
  sso_configurations = local.sso_configurations
}
