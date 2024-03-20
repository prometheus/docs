NANOC      = bundle exec nanoc
GUARD      = bundle exec guard
DOWNLOADS := prometheus alertmanager blackbox_exporter consul_exporter graphite_exporter memcached_exporter mysqld_exporter node_exporter promlens pushgateway statsd_exporter

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
	@echo "curl -sf -H 'Accept: application/vnd.github.v3+json' <GITHUB_AUTHENTICATION> https://api.github.com/repos/prometheus/$* > $@"
	@curl -sf -H 'Accept: application/vnd.github.v3+json' $(GITHUB_AUTHENTICATION) https://api.github.com/repos/prometheus/$* > $@

downloads/%/releases.json:
	@mkdir -p $(dir $@)
	@echo "curl -sf -H 'Accept: application/vnd.github.v3+json' <GITHUB_AUTHENTICATION> https://api.github.com/repos/prometheus/$*/releases > $@"
	@curl -sf -H 'Accept: application/vnd.github.v3+json' $(GITHUB_AUTHENTICATION) https://api.github.com/repos/prometheus/$*/releases > $@

guard:
	$(GUARD)

serve:
	$(NANOC) view

.PHONY: build bundle clean compile downloads serve
