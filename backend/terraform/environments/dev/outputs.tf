output "hosted_zone_ns_values" {
  description = "A map of all of our hosted zone nameservers."

  value = {
    for name, zone in module.domains : name => zone.name_servers
  }
}