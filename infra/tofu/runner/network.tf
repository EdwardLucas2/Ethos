resource "oci_core_vcn" "runner" {
  compartment_id = local.compartment_ocid
  cidr_block     = "10.0.0.0/16"
  display_name   = "ethos-runner-vcn"
  dns_label      = "runner"
}

resource "oci_core_internet_gateway" "runner" {
  compartment_id = local.compartment_ocid
  vcn_id         = oci_core_vcn.runner.id
  display_name   = "ethos-runner-igw"
  enabled        = true
}

resource "oci_core_route_table" "runner" {
  compartment_id = local.compartment_ocid
  vcn_id         = oci_core_vcn.runner.id
  display_name   = "ethos-runner-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    network_entity_id = oci_core_internet_gateway.runner.id
    destination_type  = "CIDR_BLOCK"
  }
}

resource "oci_core_security_list" "runner" {
  compartment_id = local.compartment_ocid
  vcn_id         = oci_core_vcn.runner.id
  display_name   = "ethos-runner-sl"

  # Allow all outbound traffic
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }

  # SSH inbound
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # HTTP/HTTPS inbound — needed for future app hosting
  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6"
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }
}

resource "oci_core_subnet" "runner" {
  compartment_id    = local.compartment_ocid
  vcn_id            = oci_core_vcn.runner.id
  cidr_block        = "10.0.0.0/24"
  display_name      = "ethos-runner-subnet"
  dns_label         = "runnersub"
  route_table_id    = oci_core_route_table.runner.id
  security_list_ids = [oci_core_security_list.runner.id]
}
