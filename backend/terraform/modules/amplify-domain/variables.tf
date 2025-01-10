variable "app_id" {
  type = string
  description = "The ID of the Amplify app."
}

variable "domains" {
  type = map(string)
  description = "A map of domain names to associate with the Amplify app."
}
