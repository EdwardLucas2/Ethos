variable "tenancy_ocid" {
  description = "OCI tenancy OCID"
}

variable "user_ocid" {
  description = "OCI user OCID"
}

variable "fingerprint" {
  description = "OCI API key fingerprint"
}

variable "private_key" {
  description = "OCI API private key (PEM content)"
  sensitive   = true
}

variable "region" {
  description = "OCI region identifier (e.g. uk-london-1)"
}

variable "compartment_ocid" {
  description = "OCI compartment OCID — defaults to tenancy root"
  default     = ""
}

locals {
  compartment_ocid = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid
}
