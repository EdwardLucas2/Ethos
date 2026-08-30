terraform {
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

provider "oci" {
  tenancy_ocid = var.tenancy_ocid
  user_ocid    = var.user_ocid
  fingerprint  = var.fingerprint
  private_key  = var.private_key
  region       = var.region
}

data "oci_objectstorage_namespace" "ns" {
  compartment_id = local.compartment_ocid
}

resource "oci_objectstorage_bucket" "tofu_state" {
  compartment_id = local.compartment_ocid
  namespace      = data.oci_objectstorage_namespace.ns.namespace
  name           = "ethos-tofu-state"
  access_type    = "NoPublicAccess"
  versioning     = "Enabled"
}
