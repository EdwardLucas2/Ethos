data "oci_identity_availability_domains" "ads" {
  compartment_id = local.compartment_ocid
}

# Latest Ubuntu 22.04 ARM64 image for A1.Flex
data "oci_core_images" "ubuntu_22_04_arm64" {
  compartment_id           = local.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = "VM.Standard.A1.Flex"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

locals {
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[var.availability_domain_index].name
  ubuntu_image_id     = data.oci_core_images.ubuntu_22_04_arm64.images[0].id

  # cloud-init: enable KVM device for Android emulator and add ubuntu user to kvm group
  cloud_init = <<-EOT
    #!/bin/bash
    echo 'KERNEL=="kvm", GROUP="kvm", MODE="0666", OPTIONS+="static_node=kvm"' > /etc/udev/rules.d/99-kvm4all.rules
    udevadm control --reload-rules
    udevadm trigger --name-match=kvm
    usermod -aG kvm ubuntu
  EOT
}

resource "oci_core_instance" "runner" {
  compartment_id      = local.compartment_ocid
  availability_domain = local.availability_domain
  display_name        = "ethos-runner"
  shape               = "VM.Standard.A1.Flex"

  shape_config {
    ocpus         = 4
    memory_in_gbs = 24
  }

  source_details {
    source_type             = "image"
    source_id               = local.ubuntu_image_id
    boot_volume_size_in_gbs = var.boot_volume_size_gb
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.runner.id
    assign_public_ip = true
    display_name     = "ethos-runner-vnic"
    hostname_label   = "runner"
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    user_data           = base64encode(local.cloud_init)
  }

  # Prevent accidental replacement of a running runner
  lifecycle {
    ignore_changes = [source_details[0].source_id]
  }
}
