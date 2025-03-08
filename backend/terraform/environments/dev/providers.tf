terraform {
  cloud {
    organization = "caleo-pro"
    workspaces {
      project = "caleo"
      name    = "caleo-core-dev"
    }
  }

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
      Environment = "caleo-bootstrap-dev"
    }
  }
}

provider "aws" {
  alias = "domain-account"
  region = "us-west-2"

  assume_role {
    role_arn = "arn:aws:iam::707495320920:role/TerraformDeploy"
  }

  default_tags {
    tags = {
      Repo        = "CaleoPro/caleo-core"
      Terraform   = true
      Environment = "caleo-bootstrap-dev"
    }
  }
}