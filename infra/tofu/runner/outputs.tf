output "runner_public_ip" {
  value       = oci_core_instance.runner.public_ip
  description = "Public IP of the runner VM — use this in infra/ansible/inventory.yml"
}

output "runner_private_ip" {
  value = oci_core_instance.runner.private_ip
}

output "instance_id" {
  value = oci_core_instance.runner.id
}
