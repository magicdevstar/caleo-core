output "name_servers" {
  description = "The nameservers for the hosted zone."
  value = aws_route53_zone.main.name_servers
}
