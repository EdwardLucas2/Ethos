# Ethos Infrastructure

Oracle Cloud Free Tier — managed with OpenTofu + Ansible.

## Directory layout

```
infra/
  tofu/
    bootstrap/   # One-time: creates OCI Object Storage bucket for Tofu state
    runner/      # GitHub Actions runner VM (VCN + subnet + A1.Flex compute)
  ansible/
    roles/
      common/        # Base packages, fail2ban, KVM group
      docker/        # Docker CE + Compose plugin
      android-sdk/   # Android SDK, emulator, arm64-v8a system image (API 34)
      github-runner/ # GitHub Actions runner daemon
    playbooks/
      site.yml       # Full runner configuration
    inventory.yml    # Update with IP from Tofu output
```

## Prerequisites

Install these locally:

```bash
brew install opentofu ansible
```

## Step 1 — OCI API key

This key lets OpenTofu provision resources on your behalf.

1. Open the [OCI Console](https://cloud.oracle.com) and sign in
2. Click the profile icon (top-right) → **My profile**
3. Scroll to **API keys** → **Add API key**
4. Select **Generate API key pair** → download the **private key** PEM file
5. Click **Add** — the console shows a config snippet:
   ```
   user=ocid1.user.oc1..aaa...
   fingerprint=xx:xx:xx:...
   tenancy=ocid1.tenancy.oc1..aaa...
   region=uk-london-1
   ```
   Note all four values.

Keep the downloaded private key PEM safe — you will not see it again.

## Step 2 — OCI Customer Secret Key (for Tofu state backend)

This is a separate S3-compatible access key for reading/writing the state bucket.

1. OCI Console → profile → **My profile** → **Customer secret keys** → **Generate secret key**
2. Name it `opentofu-state`
3. Copy the **secret** immediately (shown only once) and the **access key** ID

## Step 3 — SSH key pair

Generate a dedicated key for the runner VM:

```bash
ssh-keygen -t ed25519 -C "ethos-runner" -f ~/.ssh/ethos-runner
```

## Step 4 — GitHub CLI authentication

The playbook fetches a runner registration token automatically using the `gh` CLI on your local machine. Make sure you're authenticated:

```bash
gh auth status   # should show your account
```

If not: `gh auth login`

## Step 5 — Bootstrap the state bucket (run once)

Create a `terraform.tfvars` file (gitignored) in `infra/tofu/bootstrap/`:

```hcl
tenancy_ocid = "ocid1.tenancy.oc1..aaa..."
user_ocid    = "ocid1.user.oc1..aaa..."
fingerprint  = "xx:xx:xx:..."
private_key  = <<-EOT
  -----BEGIN PRIVATE KEY-----
  ...paste PEM content here...
  -----END PRIVATE KEY-----
EOT
region       = "uk-london-1"
```

Then apply:

```bash
cd infra/tofu/bootstrap
tofu init
tofu apply
```

Note the `namespace` and `s3_endpoint` outputs.

## Step 6 — Configure Tofu remote state backend

Create `infra/tofu/runner/backend.hcl` (gitignored — copy from `backend.hcl.example`):

```hcl
region     = "uk-london-1"
endpoint   = "https://<NAMESPACE>.compat.objectstorage.uk-london-1.oraclecloud.com"
access_key = "<CUSTOMER_SECRET_ACCESS_KEY>"
secret_key = "<CUSTOMER_SECRET_SECRET_KEY>"
```

## Step 7 — Provision the runner VM

Create `infra/tofu/runner/terraform.tfvars` (gitignored):

```hcl
tenancy_ocid   = "ocid1.tenancy.oc1..aaa..."
user_ocid      = "ocid1.user.oc1..aaa..."
fingerprint    = "xx:xx:xx:..."
private_key    = <<-EOT
  -----BEGIN PRIVATE KEY-----
  ...paste PEM content here...
  -----END PRIVATE KEY-----
EOT
region         = "uk-london-1"
ssh_public_key = "ssh-ed25519 AAAA... ethos-runner"  # contents of ~/.ssh/ethos-runner.pub
```

Apply:

```bash
cd infra/tofu/runner
tofu init -backend-config=backend.hcl
tofu apply
```

Note the `runner_public_ip` output.

## Step 8 — Update Ansible inventory

Edit `infra/ansible/inventory.yml` and replace `REPLACE_WITH_TOFU_OUTPUT` with the IP from the previous step.

## Step 9 — Configure the VM

```bash
cd infra/ansible
ansible-playbook playbooks/site.yml \
  --private-key ~/.ssh/ethos-runner \
  -e "github_repo=EdwardLucas2/Ethos"
```

This installs Docker, the Android SDK (API 34 arm64-v8a), and registers the GitHub Actions runner. The runner will appear in **GitHub → repo → Settings → Actions → Runners** when complete.

## Updating the runner

To update the runner binary to a new version:

```bash
# Update runner_version in infra/ansible/roles/github-runner/defaults/main.yml
# Then re-run (idempotent — skips already-installed SDK components):
cd infra/ansible
ansible-playbook playbooks/site.yml --private-key ~/.ssh/ethos-runner -e "github_repo=EdwardLucas2/Ethos"
```

## Re-provisioning from scratch

```bash
cd infra/tofu/runner
tofu destroy   # destroys the VM — data is lost
tofu apply     # new VM, same IP type (new public IP will be assigned)
# Update inventory.yml with new IP, then:
cd infra/ansible && ansible-playbook playbooks/site.yml --private-key ~/.ssh/ethos-runner -e "github_repo=EdwardLucas2/Ethos"
```

## Phase 2 — App hosting (planned)

The same VM (4 OCPU / 24 GB) has headroom to also run:
- Nginx reverse proxy + TLS (Certbot)
- Java backend JAR
- PostgreSQL + SuperTokens Core (Docker Compose)

A future `infra/tofu/app/` module and `infra/ansible/roles/app/` role will cover this.
