# How to use

```yaml
- name: Set fluence-app-service version
  uses: fluencelabs/github-actions/cargo-set-dependency@main
  with:
    package: fluence-app-service
    version: |
        {
          "version": "=0.22.1",
          "registry": "fluence"
        }
```
