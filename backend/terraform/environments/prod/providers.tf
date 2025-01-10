terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"

  default_tags {
    tags = {
      Repo        = "CaleoPro/caleo-core"
      Terraform   = true
      Environment = "caleo-bootstrap"
    }
  }
}