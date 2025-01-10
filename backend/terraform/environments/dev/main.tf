locals {
  amplify_id = "d1devc1e4gname"

  hosted_zones = {
    "dev" = "dev.caleopro.com"
    "azure" = "azure.caleopro.com"
  }
}

module "domains" {
  for_each = local.hosted_zones

  source = "../../modules/hosted-zone"

  zone_name = each.value
}

module "amplify_domains" {
  source = "../../modules/amplify-domain"

  # They sadly don't have a data attribute for this :(
  app_id = local.amplify_id

  domains = {
    "dev" = "dev.caleopro.com"
    # SSO Config
    "azure" = "azure.caleopro.com"
  }
}

import {
  to = module.domains["azure"].aws_route53_zone.main
  id = "Z0500544S478HPDSOU51"
}

import {
  to = module.domains["dev"].aws_route53_zone.main
  id = "Z10463933IY6QHZX2AKNA"
}
