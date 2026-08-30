terraform {
  backend "s3" {
    bucket = "ethos-tofu-state"
    key    = "runner/terraform.tfstate"

    # OCI Object Storage S3-compat settings — region/endpoint/credentials come from backend.hcl
    skip_region_validation      = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    force_path_style            = true
  }
}
