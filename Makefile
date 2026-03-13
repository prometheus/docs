# TODO(bwplotka): Add more files to format.
MD_FILES_TO_FORMAT=docs/specs/om/open_metrics_spec_2_0.md

MDOX="mdox"
$(MDOX):
	@go install github.com/bwplotka/mdox@v0.9.0

.PHONY: help
help: ## Displays help.
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

.PHONY: fmt
fmt: ## Format docs.
fmt: $(MDOX)
	@echo "Formatting markdown files..."
	@$(MDOX) fmt --links.validate $(MD_FILES_TO_FORMAT)

.PHONY: check
check: ## Checks if doc is formatter and links are correct (don't check external links).
check: $(MDOX)
	@echo "Checking markdown file formatting and basic links..."
	@$(MDOX) fmt --links.validate --links.validate.config-file=./.mdox.validator.yaml --check $(MD_FILES_TO_FORMAT) || (echo "🔥 Validation failed, files not formatted or links are broken. Try running 'make fmt' to fix formatting!" && exit 1)
	@echo "✅ Markdown files correctly formatted"
