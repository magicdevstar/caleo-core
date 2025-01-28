locals {
  amplify_id = "d1devc1e4gname"

  hosted_zones = {
    "dev" = "dev.caleopro.com"
    # SSO Config
    "azure" = "azure.caleopro.com"
    "lasd-dev" = "lasd-dev.caleopro.com"
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

  domains = local.hosted_zones
}
