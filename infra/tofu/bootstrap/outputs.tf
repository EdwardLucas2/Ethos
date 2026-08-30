output "bucket_name" {
  value = oci_objectstorage_bucket.tofu_state.name
}

output "namespace" {
  value = data.oci_objectstorage_namespace.ns.namespace
}

output "s3_endpoint" {
  value       = "https://${data.oci_objectstorage_namespace.ns.namespace}.compat.objectstorage.${var.region}.oraclecloud.com"
  description = "Use this as 'endpoint' in backend.hcl"
}
