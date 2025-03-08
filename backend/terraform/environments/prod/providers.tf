terraform {
  cloud {
    organization = "caleo-pro"
    workspaces {
      project = "caleo"
      name    = "caleo-core-prod"
    }
  }

  required_providers {
    tfe = {
      version = "~> 0.62.0"
    }

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
      Environment = "caleo-bootstrap-prod"
    }
  }
}