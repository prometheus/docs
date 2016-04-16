DOWNLOADS := prometheus alertmanager blackbox_exporter haproxy_exporter mysqld_exporter node_exporter pushgateway statsd_exporter

clean:
	rm -rf output downloads

compile: clean downloads
	bundle exec nanoc

deploy: github_pages_export github_pages_push

downloads: $(DOWNLOADS:%=downloads/%/repo.json) $(DOWNLOADS:%=downloads/%/releases.json)

downloads/%/repo.json:
	mkdir -p $(dir $@)
	curl -sf -H 'Accept: application/vnd.github.v3+json' https://api.github.com/repos/prometheus/$* > $@

downloads/%/releases.json:
	mkdir -p $(dir $@)
	curl -sf -H 'Accept: application/vnd.github.v3+json' https://api.github.com/repos/prometheus/$*/releases > $@

github_pages_export: compile
	cd output && \
	echo prometheus.io > CNAME && \
	git init && \
	git config user.name "Travis CI" && \
	git config user.email "travis@prometheus.io" && \
	git add . && \
	git commit --message="Static site builder output"

github_pages_push:
	cd output && \
	git push -f git@github.com:prometheus/prometheus.github.io master

.PHONY: compile deploy github_pages_export github_pages_push
