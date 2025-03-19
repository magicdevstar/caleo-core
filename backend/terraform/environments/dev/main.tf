locals {
  stage         = "dev"
  amplify_id    = "d1devc1e4gname"
  caleo_zone_id = "Z04140351SPNE9TCKBJWA"

  sso_configurations = {
    "azure" = {
      metadata_url      = "https://login.microsoftonline.com/bf3b4897-ea8a-41c9-adf2-15d15c6c91d1/federationmetadata/2007-06/federationmetadata.xml?appid=4a78ffa2-11ad-4edb-a437-74c980fad36c"
      attribute_mapping = {
        email           = "email"
        family_name     = "surname"
        given_name      = "givenname"
        "custom:phony"  = "phone"
      }
    }
    "lasd-dev" = {
      metadata_url             = "https://login.microsoftonline.com/10912896-cd7e-496c-baf0-6a664593a177/federationmetadata/2007-06/federationmetadata.xml?appid=0977712d-b052-41ac-ba4d-6d5367b04e56"
      attribute_mapping        = {
        email                  = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
        family_name            = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
        given_name             = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
        "custom:phony"         = "Telephone Number"
        "custom:p_number"      = "extenstionAttribute13"
        "custom:employee_date" = "extensionAttribute10"
      }
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

resource "aws_route53_record" "subdomain" {
  for_each = {
    for name, zone in module.domains : name => [for ns in zone.name_servers : "${ns}."]
  }

  provider = aws.domain-account

  zone_id = local.caleo_zone_id
  name    = "${each.key}.caleopro.com"
  type    = "NS"
  ttl     = "60"
  records = each.value
}

import {
  to = aws_route53_record.subdomain["dev"]
  id = "Z04140351SPNE9TCKBJWA_dev.caleopro.com_NS"
}

import {
  to = aws_route53_record.subdomain["lasd-dev"]
  id = "Z04140351SPNE9TCKBJWA_lasd-dev.caleopro.com_NS"
}

import {
  to = aws_route53_record.subdomain["azure"]
  id = "Z04140351SPNE9TCKBJWA_azure.caleopro.com_NS"
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

module "cognito" {
  source = "../../modules/cognito"

  user_pool_name     = "caleo-${local.stage}"
  client_name        = "caleo-${local.stage}"
  callback_urls      = local.cognito_client_urls
  logout_urls        = local.cognito_client_urls
  cognito_domain     = "caleo-pro-${local.stage}"
  from_email         = "${local.stage}.caleopro.com"
  sso_configurations = local.sso_configurations
  stage              = local.stage
  installHooks       = true
}
