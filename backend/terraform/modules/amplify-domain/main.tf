resource "aws_amplify_domain_association" "domain" {
  for_each = var.domains

  app_id      = var.app_id
  domain_name = each.value
  wait_for_verification = true

  sub_domain {
    branch_name = "main"
    prefix      = ""
  }
}