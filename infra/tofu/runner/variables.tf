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

variable "ssh_public_key" {
  description = "SSH public key to inject into the instance (contents of id_ed25519.pub)"
}

variable "availability_domain_index" {
  description = "Index of the availability domain to use (0-based)"
  default     = 0
}

variable "boot_volume_size_gb" {
  description = "Boot volume size in GB"
  default     = 100
}

locals {
  compartment_ocid = var.compartment_ocid != "" ? var.compartment_ocid : var.tenancy_ocid
}
