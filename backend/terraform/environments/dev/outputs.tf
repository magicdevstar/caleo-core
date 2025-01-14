output "hosted_zone_ns_values" {
  description = "A map of all of our hosted zone nameservers."

  value = nonsensitive({
    for name, zone in module.domains : name => [for ns in zone.name_servers : "${ns}."]
  })
}