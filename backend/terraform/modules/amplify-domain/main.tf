resource "aws_amplify_domain_association" "domain" {
  for_each = var.domains

  app_id      = var.app_id
  domain_name = each.value

  sub_domain {
    branch_name = "main"
    prefix      = ""
  }
}