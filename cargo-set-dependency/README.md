# How to use

```yaml
- name: Override dependencies version
  uses: fluencelabs/github-actions/cargo-set-dependency@main
  with:
    dependencies: |
      [
        {
          "package": "fluence-app-service",
          "version": "0.22.1",
        },
        {
          "package": "marine-runtime",
          "manifest": "avm/server/Cargo.toml", # path to Cargo.toml file to change
          "version": "=0.22.1",
          "registry": "fluence"
        }
      ]
```
