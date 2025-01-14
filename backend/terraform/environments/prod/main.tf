locals {
  caleo_zone_id = "Z04140351SPNE9TCKBJWA"
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

import {
  to = aws_route53_record.subdomain["dev"]
  id = "${local.caleo_zone_id}_dev.caleopro.com_NS"
}
import {
  to = aws_route53_record.subdomain["azure"]
  id = "${local.caleo_zone_id}_azure.caleopro.com_NS"
}
