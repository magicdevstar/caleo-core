locals {
  amplify_id = "d1devc1e4gname"
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
  to = module.amplify_domains.aws_amplify_domain_association.domain["dev"]
  id = "${local.amplify_id}/dev.caleopro.com"
}
