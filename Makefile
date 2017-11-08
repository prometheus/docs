DOWNLOADS := prometheus alertmanager blackbox_exporter consul_exporter graphite_exporter haproxy_exporter memcached_exporter mysqld_exporter node_exporter pushgateway statsd_exporter

build: clean downloads compile

clean:
	rm -rf output downloads repositories

compile:
	bundle exec nanoc

downloads: $(DOWNLOADS:%=downloads/%/repo.json) $(DOWNLOADS:%=downloads/%/releases.json)

downloads/%/repo.json:
	@mkdir -p $(dir $@)
	@echo "curl -sf -H 'Accept: application/vnd.github.v3+json' <GITHUB_AUTHENTICATION> https://api.github.com/repos/prometheus/$* > $@"
	@curl -sf -H 'Accept: application/vnd.github.v3+json' $(GITHUB_AUTHENTICATION) https://api.github.com/repos/prometheus/$* > $@

downloads/%/releases.json:
	@mkdir -p $(dir $@)
	@echo "curl -sf -H 'Accept: application/vnd.github.v3+json' <GITHUB_AUTHENTICATION> https://api.github.com/repos/prometheus/$*/releases > $@"
	@curl -sf -H 'Accept: application/vnd.github.v3+json' $(GITHUB_AUTHENTICATION) https://api.github.com/repos/prometheus/$*/releases > $@

.PHONY: build compile deploy
