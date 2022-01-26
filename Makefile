NANOC     ?= bundle exec nanoc
GUARD     ?= bundle exec guard
DOWNLOADS := $(shell cat downloads.cfg)

build: clean downloads compile

bundle:
	bundle config build.nokogiri --use-system-libraries
	bundle install --path vendor

clean:
	rm -rf output downloads

compile:
	$(NANOC)

downloads: $(DOWNLOADS:%=downloads/%/repo.json) $(DOWNLOADS:%=downloads/%/releases.json)

downloads/%/repo.json:
	@mkdir -p $(dir $@)
	@echo "curl -sf -H 'Accept: application/vnd.github.v3+json' <GITHUB_AUTHENTICATION> https://api.github.com/repos/$* > $@"
	@curl -sf -H 'Accept: application/vnd.github.v3+json' $(GITHUB_AUTHENTICATION) https://api.github.com/repos/$* > $@

downloads/%/releases.json:
	@mkdir -p $(dir $@)
	@echo "curl -sf -H 'Accept: application/vnd.github.v3+json' <GITHUB_AUTHENTICATION> https://api.github.com/repos/$*/releases > $@"
	@curl -sf -H 'Accept: application/vnd.github.v3+json' $(GITHUB_AUTHENTICATION) https://api.github.com/repos/$*/releases > $@

guard:
	$(GUARD)

serve:
	$(NANOC) view

.PHONY: build bundle clean compile downloads serve
