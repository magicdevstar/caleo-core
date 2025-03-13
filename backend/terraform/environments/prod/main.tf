locals {
  stage         = "prod"
  amplify_id    = "d3pd2r6xuxvieq"

  sso_configurations = {
    "lasd" = {
      metadata_url      = "https://login.microsoftonline.com/10912896-cd7e-496c-baf0-6a664593a177/federationmetadata/2007-06/federationmetadata.xml?appid=74c2d578-fc4d-4035-9b4a-d96a3aef12c7"
      attribute_mapping = {
        email                  = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        family_name            = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
        given_name             = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
        "custom:phony"         = "user.telephonenumber"
        # "custom:p_number"      = "employeeID"
        # "custom:employee_date" = "extensionAttribute10"
      }
    }
  }

  base_domains = {
    "app" = "app.caleopro.com"
    "lvmpd" = "lvmpd.caleopro.com"
  }

  sso_domains = {
    for k, _ in local.sso_configurations : k => "${k}.caleopro.com"
  }

  domains = merge(local.base_domains, local.sso_domains)

  cognito_client_urls = concat(
    [
      "https://app.caleopro.com",
      "https://lvmpd.caleopro.com"
    ],
    [for key in keys(local.sso_configurations) : "https://${key}.caleopro.com"]
  )
}

module "amplify_domains" {
  source = "../../modules/amplify-domain"
  app_id = local.amplify_id
  domains = local.domains
}

module "cognito" {
  source = "../../modules/cognito"

  user_pool_name     = "caleo-${local.stage}"
  client_name        = "caleo-${local.stage}"
  callback_urls      = local.cognito_client_urls
  logout_urls        = local.cognito_client_urls
  cognito_domain     = "caleo-pro-${local.stage}"
  from_email         = "caleopro.com"
  sso_configurations = local.sso_configurations
  stage              = local.stage
  installHooks       = true
}
