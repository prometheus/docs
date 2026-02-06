.PHONY: mdox-check
mdox-check:
	@mdox fmt --links.validate --check $$(find . -type d -name node_modules -prune -o -type d -name .next -prune -o -type d -name .git -prune -o -name '*.md' -print)
