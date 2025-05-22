variable "bucket_name" {
  description = "The name of the S3 bucket."
  type        = string
}

variable "files" {
  description = "An array of objects containing orgId, key, data as a local file object, and type of the file."
  type = list(object({
    orgId = string
    key   = string
    data  = string
    type  = string
  }))
}