resource "aws_s3_bucket" "bucket" {
  bucket_prefix = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Environment = "production"
  }
}

resource "aws_s3_bucket_policy" "public_access" {
  bucket = aws_s3_bucket.bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = ["s3:GetObject"]
        Resource  = ["${aws_s3_bucket.bucket.arn}/*"]
      }
    ]
  })
}

resource "aws_s3_object" "files" {
  for_each = { for file in var.files : format("%s/%s", file.orgId, file.key) => file }

  bucket  = aws_s3_bucket.bucket.bucket
  key     = each.key
  content = each.value.data
  acl     = "public-read"

  metadata = {
    type = each.value.type
  }
}