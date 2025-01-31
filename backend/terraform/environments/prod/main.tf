locals {
  caleo_zone_id = "Z04140351SPNE9TCKBJWA"
  amplify_id = "d3pd2r6xuxvieq"
  user_pool_id = "us-west-2_3enNflKSo"

  sso_configurations = {
    "lasd" = {
      metadata_url = "https://login.microsoftonline.com/10912896-cd7e-496c-baf0-6a664593a177/federationmetadata/2007-06/federationmetadata.xml?appid=74c2d578-fc4d-4035-9b4a-d96a3aef12c7"
      email_attribute = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
      family_name_attribute = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
      given_name_attribute = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
      phone_number_attribute = "user.telephonenumber"
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
}

data "tfe_outputs" "caleo_core_dev" {
  organization = "caleo-pro"
  workspace = "caleo-core-dev"
}

resource "aws_route53_record" "subdomain" {
  for_each = nonsensitive(data.tfe_outputs.caleo_core_dev.values.hosted_zone_ns_values)

  zone_id = local.caleo_zone_id
  name    = "${each.key}.caleopro.com"
  type    = "NS"
  ttl     = "60"
  records = each.value
}

module "amplify_domains" {
  source = "../../modules/amplify-domain"
  app_id = local.amplify_id
  domains = local.domains
}

import {
  to = module.amplify_domains.aws_amplify_domain_association.domain["app"]
  id = "${local.amplify_id}/app.caleopro.com"
}

import {
  to = module.amplify_domains.aws_amplify_domain_association.domain["lvmpd"]
  id = "${local.amplify_id}/lvmpd.caleopro.com"
}

module "cognito_providers" {
  for_each = local.sso_configurations

  source = "../../modules/cognito_provider"

  user_pool_id = local.user_pool_id
  provider_name = each.key
  metadata_url = each.value.metadata_url
  email_attribute = each.value.email_attribute
  family_name_attribute = each.value.family_name_attribute
  given_name_attribute = each.value.given_name_attribute
  phone_number_attribute = each.value.phone_number_attribute
}
